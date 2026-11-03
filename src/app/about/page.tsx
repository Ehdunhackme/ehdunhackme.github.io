"use client";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
export default function About() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/" + (location.hash || "#about-deck"));
  }, [router]);
  return (
    <main className="profile">
      <p>
        About me is now on the home page.{" "}
        <Link href="/#about-deck">Explore the cards →</Link>
      </p>
    </main>
  );
}
