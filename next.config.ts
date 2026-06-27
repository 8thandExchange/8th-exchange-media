import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.8emedia.com" }],
        destination: "https://8emedia.com/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: "media.8thandexchange.com" }],
        destination: "https://8emedia.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
