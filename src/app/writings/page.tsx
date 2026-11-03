import type { Metadata } from "next";
import { WritingsContent } from "@/content/writings";
export const metadata: Metadata = {
  title: "Writings",
  description: "Selected writings and lists by Dun Li Chan.",
  alternates: { canonical: "/writings/" },
};
export default function Writings() {
  return <WritingsContent />;
}
