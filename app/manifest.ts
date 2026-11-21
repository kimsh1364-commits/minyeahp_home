import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "우리집 짓는 중",
    short_name: "우리집",
    description: "모은 만큼 지어지고 채워지는 우리집",
    start_url: "/",
    display: "standalone",
    background_color: "#f6efe4",
    theme_color: "#f6efe4",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
