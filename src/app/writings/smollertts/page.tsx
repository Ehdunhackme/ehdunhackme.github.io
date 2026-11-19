import type { Metadata } from "next";
import { SmollerArticle } from "@/content/smollertts";

const title = "SmollerTTS, a 2.81M-parameter English TTS model";
const description =
  "Building a small English text-to-speech model: the architecture, training, browser runtime and what the listening tests taught me.";

export const metadata: Metadata = {
  title: { absolute: `${title} | Dun Li Chan` },
  description,
  alternates: { canonical: "/writings/smollertts/" },
  openGraph: {
    type: "article",
    title,
    description,
    url: "/writings/smollertts/",
    publishedTime: "2026-11-19",
    authors: ["Dun Li Chan"],
    images: [{
      url: "/assets/writings/smollertts/architecture-flow-preview.png",
      width: 584,
      height: 714,
      alt: "SmollerTTS flow from text and phonemes to acoustic features and a speech waveform",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/assets/writings/smollertts/architecture-flow-preview.png"],
  },
};

export default function SmollerPostPage() {
  return <SmollerArticle />;
}
