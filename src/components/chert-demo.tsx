"use client";
import { useEffect, useState } from "react";
export function ChertDemo() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    let disposed = false;
    fetch("https://chert.dunlichan.com/ready", {
      signal: controller.signal,
      credentials: "omit",
    })
      .then((response) => {
        if (!disposed) setOffline(!response.ok);
      })
      .catch(() => {
        if (!disposed) setOffline(true);
      })
      .finally(() => clearTimeout(timer));
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, []);
  return (
    <>
      <main>
        <iframe
          id="call"
          src="https://chert.dunlichan.com"
          title="Chert video call"
          allow="camera; microphone; autoplay; fullscreen"
          allowFullScreen
          referrerPolicy="no-referrer"
        />
      </main>
      <aside id="connection-notice" role="status" hidden={!offline}>
        <span>The demo is temporarily offline.</span>
        <a
          href="https://chert.dunlichan.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open directly ↗
        </a>
      </aside>
      <noscript>
        <a href="https://chert.dunlichan.com">Open the Chert call</a>
      </noscript>
    </>
  );
}
