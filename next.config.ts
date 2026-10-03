import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bukti transfer manual (mode tanpa R2) disimpan di public/uploads
  images: { remotePatterns: [] },
};

export default nextConfig;
