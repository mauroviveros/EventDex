import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "*.googleusercontent.com" },
      { hostname: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("/")[2]}` },
    ],
  }
};

export default nextConfig;
