import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // La home dejó de existir: su resumen vive en el listado de eventos.
  async redirects() {
    return [{ source: "/", destination: "/events", permanent: false }];
  },
  images: {
    remotePatterns: [
      { hostname: "*.googleusercontent.com" },
      { hostname: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.split("/")[2]}` },
    ],
  },
};

export default nextConfig;
