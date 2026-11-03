import type { Metadata } from "next";
import { AboutContent } from "@/content/about";

export const metadata: Metadata = {
  title: "More about me",
  description: "Dun Li Chan's journey, motivations, honours and awards.",
  alternates: { canonical: "/about/" },
};

export default function About() {
  return <AboutContent />;
}
