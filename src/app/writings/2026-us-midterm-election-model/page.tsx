import type { Metadata } from "next";
import { MidtermArticle } from "@/content/midterms-2026";

export const metadata: Metadata = {
  title: { absolute: "2026 US Midterm Election Model | Dun Li Chan" },
  description:
    "Training on multiple election cycles, comparing five models, and estimating two-party vote shares in selected 2026 House and Senate races.",
  alternates: { canonical: "/writings/2026-us-midterm-election-model/" },
  openGraph: {
    type: "article",
    title: "2026 US Midterm Election Model",
    description:
      "A retrospective model of selected congressional races, with historical validation and uncertainty estimates.",
    url: "/writings/2026-us-midterm-election-model/",
    publishedTime: "2026-11-08",
    authors: ["Dun Li Chan"],
    images: [
      {
        url: "/assets/writings/midterms-2026/preview.png",
        alt: "Historical congressional predictions compared with election results",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "2026 US Midterm Election Model",
    images: ["/assets/writings/midterms-2026/preview.png"],
  },
};

export default function MidtermModelPage() {
  return <MidtermArticle />;
}
