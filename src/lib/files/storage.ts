import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Private object storage. Files are never publicly addressable: every download goes
 * through /api/files/[id], which checks row-level security first.
 *
 *  - STORAGE_DRIVER=local (development/tests): STORAGE_DIR on the server's disk.
 *    Not suitable for serverless hosting (ephemeral, per-instance filesystem).
 *  - STORAGE_DRIVER=s3 (production): any S3-compatible bucket (AWS S3, Cloudflare R2,
 *    Backblaze B2, MinIO). Block all public access and enable server-side encryption.
 */
export interface StorageDriver {
  name: string;
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  remove(key: string): Promise<void>;
}

function local(): StorageDriver {
  const root = path.resolve(process.env.STORAGE_DIR ?? "./storage");
  const resolve = (key: string) => {
    const p = path.resolve(root, key);
    if (!p.startsWith(root + path.sep)) throw new Error("invalid storage key");
    return p;
  };
  return {
    name: "local",
    async put(key, body) {
      const p = resolve(key);
      await mkdir(path.dirname(p), { recursive: true });
      await writeFile(p, body, { mode: 0o600 });
    },
    get: (key) => readFile(resolve(key)),
    remove: (key) => rm(resolve(key), { force: true }),
  };
}

function s3(): StorageDriver {
  const bucket = process.env.S3_BUCKET;
  if (!bucket) throw new Error("S3_BUCKET is not set");
  // Lazy import keeps the SDK out of code paths that do not use it.
  const sdk = import("@aws-sdk/client-s3");
  const client = sdk.then(
    ({ S3Client }) =>
      new S3Client({
        region: process.env.S3_REGION ?? "us-east-1",
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: !!process.env.S3_ENDPOINT,
        credentials: process.env.S3_ACCESS_KEY_ID ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" } : undefined,
      }),
  );
  return {
    name: "s3",
    async put(key, body, contentType) {
      const { PutObjectCommand } = await sdk;
      await (await client).send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType, ServerSideEncryption: process.env.S3_SSE === "none" ? undefined : "AES256" }));
    },
    async get(key) {
      const { GetObjectCommand } = await sdk;
      const r = await (await client).send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      return Buffer.from(await r.Body!.transformToByteArray());
    },
    async remove(key) {
      const { DeleteObjectCommand } = await sdk;
      await (await client).send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },
  };
}

let cached: StorageDriver | null = null;
export function storage(): StorageDriver {
  if (cached) return cached;
  const d = process.env.STORAGE_DRIVER ?? "local";
  if (d === "local" && process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_STORAGE !== "1") {
    throw new Error("STORAGE_DRIVER=local is not allowed in production; configure S3-compatible storage");
  }
  cached = d === "s3" ? s3() : local();
  return cached;
}
