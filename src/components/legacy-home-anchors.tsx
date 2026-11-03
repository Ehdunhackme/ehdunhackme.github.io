"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Keep links shared before the About page moved off the homepage working.
const destinations: Record<string, string> = {
  "#more-about-me": "/about/#more-about-me",
  "#journey-heading": "/about/#more-about-me",
  "#motivations": "/about/#motivations",
  "#motivations-heading": "/about/#motivations",
  "#motivation-education": "/about/#motivation-education",
  "#motivation-ai": "/about/#motivation-ai",
  "#honours": "/about/#honours",
  "#awards-heading": "/about/#honours",
  "#honours-heading": "/about/#honours",
  "#miscellaneous-heading": "/about/#miscellaneous-heading",
  "#research": "/projects/",
  "#writings": "/writings/",
};

export function LegacyHomeAnchors() {
  const router = useRouter();
  useEffect(() => {
    const redirect = () => {
      const destination = destinations[location.hash];
      if (destination) router.replace(destination);
    };
    redirect();
    window.addEventListener("hashchange", redirect);
    return () => window.removeEventListener("hashchange", redirect);
  }, [router]);
  return null;
}
