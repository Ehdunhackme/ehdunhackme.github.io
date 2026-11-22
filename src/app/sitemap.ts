import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/about/",
    "/projects/",
    "/writings/",
    "/writings/arcbench/",
    "/writings/smollertts/",
    "/writings/2026-us-midterm-election-model/",
    "/writings/my-opinionated-guide-to-starting-research-early/",
    "/contact/",
    "/projects/chert/",
    "/projects/smollertts/",
  ].map((path) => ({ url: "https://dunlichan.com" + path }));
}
