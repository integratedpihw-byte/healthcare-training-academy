import type { MetadataRoute } from "next";

/** Lets staff add the academy to a phone's home screen with the proper name and icon. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Complete Healthcare Innovative Training Academy",
    short_name: "CHITA",
    description: "Healthcare workforce training, competency validation and regulatory compliance management.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0b2545",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
