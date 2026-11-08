import type { Metadata } from "next";
import { MidtermArticle } from "@/content/midterms-2026";

export const metadata: Metadata = {
  title: { absolute: "2026 US Midterm Election Model | Dun Li Chan" },
  description:
    "Comparing 13 election models across past elections, then applying the selected poll/baseline blend to all 435 House districts and 35 Senate contests.",
  alternates: { canonical: "/writings/2026-us-midterm-election-model/" },
  openGraph: {
    type: "article",
    title: "2026 US Midterm Election Model",
    description:
      "A retrospective forecast across all 50 states, with one model, complete race coverage and historical validation.",
    url: "/writings/2026-us-midterm-election-model/",
    publishedTime: "2026-11-08",
    authors: ["Dun Li Chan"],
    images: [
      {
        url: "/assets/writings/midterms-2026/preview.png",
        alt: "Projected House seats across all 50 states",
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
