import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kistebunden",
    short_name: "Kistebunden",
    description: "Det, vi har på kistebunden. Vores private økonomi fra i dag til 2035.",
    lang: "da",
    start_url: "/",
    display: "standalone",
    background_color: "#0b1026",
    theme_color: "#0b1026",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
