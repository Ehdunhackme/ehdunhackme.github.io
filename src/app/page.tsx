import type { Metadata } from "next";
import { HomeContent } from "@/content/home";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default function Home() {
  return <HomeContent />;
}
