import { headers } from "next/headers";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Complete Healthcare Innovative Training Academy", template: "%s · Complete Healthcare Innovative Training Academy" },
  description: "Healthcare workforce training, competency validation and regulatory compliance management.",
  robots: { index: false },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b2545" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading the request headers renders every page per request, so Next.js can attach
  // the CSP nonce (set by middleware) to its scripts.
  await headers();
  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        <a href="#main" className="skip-link">Skip to main content</a>
        {children}
      </body>
    </html>
  );
}
