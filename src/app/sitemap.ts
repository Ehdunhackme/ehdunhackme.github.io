import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/",
    "/projects/",
    "/writings/",
    "/writings/my-opinionated-guide-to-starting-research-early/",
    "/contact/",
    "/projects/chert/",
  ].map((path) => ({ url: "https://dunlichan.com" + path }));
}
