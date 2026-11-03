import type { Metadata } from "next";
import { Contact } from "@/components/contact";
export const metadata: Metadata = {
  title: "Contact",
  description: "Contact Dun Li Chan.",
  alternates: { canonical: "/contact/" },
};
export default function ContactPage() {
  return <Contact />;
}
