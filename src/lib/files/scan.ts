import "server-only";
import net from "node:net";

/**
 * Malware scanning via ClamAV's clamd INSTREAM protocol (CLAMAV_HOST / CLAMAV_PORT).
 * When no scanner is configured the file is stored as NOT_SCANNED, unless
 * UPLOAD_REQUIRE_SCAN=1 (recommended in production), in which case uploads are refused.
 */
export type ScanResult = { status: "CLEAN" } | { status: "INFECTED"; signature: string } | { status: "NOT_SCANNED" } | { status: "ERROR"; message: string };

export function scannerConfigured() {
  return !!process.env.CLAMAV_HOST;
}

export async function scan(buf: Buffer): Promise<ScanResult> {
  const host = process.env.CLAMAV_HOST;
  if (!host) return { status: "NOT_SCANNED" };
  const port = Number(process.env.CLAMAV_PORT ?? 3310);
  return new Promise((resolve) => {
    const sock = net.createConnection({ host, port });
    let out = "";
    const done = (r: ScanResult) => {
      sock.destroy();
      resolve(r);
    };
    sock.setTimeout(30_000, () => done({ status: "ERROR", message: "scanner timeout" }));
    sock.on("error", (e) => done({ status: "ERROR", message: e.message }));
    sock.on("data", (d) => (out += d.toString()));
    sock.on("end", () => {
      if (/OK\0?$/.test(out.trim())) done({ status: "CLEAN" });
      else if (/FOUND/.test(out)) done({ status: "INFECTED", signature: out.replace(/^stream:\s*/, "").replace(/\s*FOUND[\s\S]*$/, "") });
      else done({ status: "ERROR", message: out.trim() || "no response" });
    });
    sock.on("connect", () => {
      sock.write("zINSTREAM\0");
      for (let i = 0; i < buf.length; i += 64 * 1024) {
        const chunk = buf.subarray(i, i + 64 * 1024);
        const len = Buffer.alloc(4);
        len.writeUInt32BE(chunk.length);
        sock.write(len);
        sock.write(chunk);
      }
      sock.write(Buffer.alloc(4));
    });
  });
}
