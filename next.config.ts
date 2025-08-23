import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: { // config image agar tidak error (author image terblokir)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      }
    ]
  }
};

export default nextConfig;
