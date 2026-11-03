import type { NextConfig } from "next";

const config: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: { formats: ["image/webp"], minimumCacheTTL: 86400 },
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      {
        source: "/:path+/index.html",
        destination: "/:path+/",
        permanent: true,
      },
      {
        source: "/papers",
        destination: "/projects/#papers-heading",
        permanent: true,
      },
      { source: "/work", destination: "/projects/", permanent: true },
    ];
  },
};
export default config;
