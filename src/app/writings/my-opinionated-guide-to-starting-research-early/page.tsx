import type { Metadata } from "next";
import { ResearchGuideContent } from "@/content/research-guide";
export const metadata: Metadata = {
  title: "My opinionated guide to starting research early",
  description: "My opinionated guide to starting research early.",
  alternates: {
    canonical: "/writings/my-opinionated-guide-to-starting-research-early/",
  },
};
export default function ResearchGuide() {
  return <ResearchGuideContent />;
}
