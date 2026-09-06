import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@spotify-clone/shared"],
  images: {
    // Dominios desde los que Spotify sirve carátulas/fotos. next/image solo
    // optimiza imágenes de hosts permitidos explícitamente.
    remotePatterns: [
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "mosaic.scdn.co" },
      { protocol: "https", hostname: "image-cdn-ak.spotifycdn.com" },
      { protocol: "https", hostname: "image-cdn-fa.spotifycdn.com" },
      { protocol: "https", hostname: "*.scdn.co" },
      { protocol: "https", hostname: "*.spotifycdn.com" },
    ],
  },
};

export default nextConfig;
