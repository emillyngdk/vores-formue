import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lyng Mandal Kapital",
    short_name: "LM Kapital",
    description: "Emil og Frederikkes private økonomi, fra i dag til 2035.",
    lang: "da",
    start_url: "/",
    display: "standalone",
    background_color: "#fbe38e",
    theme_color: "#fbe38e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
