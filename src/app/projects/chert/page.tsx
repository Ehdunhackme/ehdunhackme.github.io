import type { Metadata } from "next";
import { ChertDemo } from "@/components/chert-demo";
export const metadata: Metadata = {
  title: "Chert demo",
  description:
    "Try Chert, an experimental conversational video avatar demo by Dun Li Chan.",
  referrer: "no-referrer",
  alternates: { canonical: "/projects/chert/" },
};
export default function Chert() {
  return <ChertDemo />;
}
