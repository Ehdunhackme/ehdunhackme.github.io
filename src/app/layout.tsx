import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import { fonts } from "@/fonts";
import "@/styles/global.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://dunlichan.com"),
  title: { default: "Dun Li's Portfolio Site", template: "%s — Dun Li Chan" },
  description: "Dun Li's Portfolio Site.",
  authors: [{ name: "Dun Li Chan" }],
  icons: { icon: "/icon.svg", apple: "/assets/dun-li-chan-icon-apple.png" },
  openGraph: {
    type: "website",
    siteName: "Dun Li's Portfolio Site",
    images: [{ url: "/assets/dun-li-chan-icon-apple.png", alt: "Dun Li Chan" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/assets/dun-li-chan-icon-apple.png"],
  },
};
const themeScript = `try { const saved = localStorage.getItem('theme'); document.documentElement.classList.toggle('dark', saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches); } catch { document.documentElement.classList.toggle('dark', matchMedia('(prefers-color-scheme: dark)').matches); }`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={fonts} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
