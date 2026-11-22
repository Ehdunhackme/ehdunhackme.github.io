import type { Metadata } from "next";
import { ArcbenchArticle, title, description } from "@/content/arcbench";

const path = "/writings/arcbench/";
const image = {
  url: "/assets/writings/arcbench/social.jpg",
  width: 1200,
  height: 630,
  alt: "The SO-101 paddle pushing a blue puck toward a target ring in Arcbench",
};

export const metadata: Metadata = {
  title: { absolute: title + " | Dun Li Chan" },
  description,
  alternates: { canonical: path },
  openGraph: {
    type: "article",
    title,
    description,
    url: path,
    publishedTime: "2026-11-22",
    authors: ["Dun Li Chan"],
    images: [image],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [image.url],
  },
};

export default function ArcbenchPostPage() {
  return <ArcbenchArticle />;
}
