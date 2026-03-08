import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return process.env.NEXT_PUBLIC_DEMO_MODE
      ? []
      : [
          {
            source: "/api/:path*",
            destination: "http://localhost:5000/api/:path*",
          },
          {
            source: "/business/:id/scrape",
            destination: "http://localhost:5000/business/:id/scrape",
          },
          {
            source: "/business/:id/export",
            destination: "http://localhost:5000/business/:id/export",
          },
        ];
  },
};

export default nextConfig;
