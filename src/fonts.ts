import localFont from "next/font/local";
const geist = localFont({
  src: "./fonts/geist-latin-wght-normal.woff2",
  variable: "--font-geist",
  display: "swap",
  weight: "100 900",
});
const mono = localFont({
  src: "./fonts/geist-mono-latin-wght-normal.woff2",
  variable: "--font-geist-mono",
  display: "swap",
  weight: "100 900",
  preload: false,
});
const instrument = localFont({
  src: [
    {
      path: "./fonts/instrument-serif-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/instrument-serif-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-instrument",
  display: "swap",
  preload: false,
});
export const fonts = [geist.variable, mono.variable, instrument.variable].join(
  " ",
);
