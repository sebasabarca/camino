import type { MetadataRoute } from "next";

// Lets Serena add the app to her iPhone home screen from Safari (Share → Add to Home Screen): it opens full screen
// with Mushroom as the icon. Android/Chrome use the same manifest.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Camino con Mushroom",
    short_name: "Camino",
    description: "Serena's Spanish course: short lessons, then a quiz.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fcf9f3",
    theme_color: "#fcf9f3",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
