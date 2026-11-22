import type { NextConfig } from "next";

const config: NextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: { formats: ["image/webp"], minimumCacheTTL: 86400 },
  async rewrites() {
    const studio = process.env.ARCBENCH_STUDIO_URL ??
      (process.env.NODE_ENV === "development" ? "http://127.0.0.1:8766" : undefined);
    return [
      ...(studio ? [{ source: "/api/arcbench/", destination: studio + "/api/run" }] : []),
      {
        source: "/projects/smollertts/",
        destination: "/projects/smollertts/index.html",
      },
    ];
  },
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
