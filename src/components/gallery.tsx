"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Photo = { src: string; full: string; alt: string };
export function Gallery({ label, items }: { label: string; items: Photo[] }) {
  const track = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loop, setLoop] = useState(false);
  const pausedUntil = useRef(0);
  const hovered = useRef(false);
  const photoOpen = useRef(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const savedScroll = useRef(0);
  const savedBody = useRef("");
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = track.current!;
    const media = matchMedia("(max-width:600px)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let canLoop = items.length > (media.matches ? 2 : 5);
    let frame = 0,
      last = 0,
      visible = false,
      position = 0;
    const tick = (time: number) => {
      frame = 0;
      const elapsed = last ? Math.min(time - last, 50) : 0;
      last = time;
      if (
        visible &&
        !document.hidden &&
        !el.closest("[hidden]") &&
        !hovered.current &&
        !photoOpen.current &&
        !el.matches(":focus-within") &&
        !reduced.matches &&
        time > pausedUntil.current
      ) {
        const clone = el.children[items.length] as HTMLElement | undefined;
        const first = el.children[0] as HTMLElement | undefined;
        const width = clone && first ? clone.offsetLeft - first.offsetLeft : 0;
        if (width > 0) {
          el.classList.add("is-auto-scrolling");
          position = (position + (26 * elapsed) / 1000) % width;
          el.scrollLeft = position;
        }
      } else {
        position = el.scrollLeft;
        el.classList.remove("is-auto-scrolling");
      }
      schedule();
    };
    const schedule = () => {
      if (visible && canLoop && !document.hidden && !reduced.matches) {
        if (!frame) frame = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(frame);
        frame = last = 0;
      }
    };
    const resize = () => {
      canLoop = items.length > (media.matches ? 2 : 5);
      setLoop(canLoop);
      schedule();
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      schedule();
    });
    observer.observe(el);
    resize();
    media.addEventListener("change", resize);
    reduced.addEventListener("change", schedule);
    document.addEventListener("visibilitychange", schedule);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      media.removeEventListener("change", resize);
      reduced.removeEventListener("change", schedule);
      document.removeEventListener("visibilitychange", schedule);
    };
  }, [items.length]);
  useEffect(
    () => () => {
      clearTimeout(closeTimer.current);
      if (photoOpen.current) {
        document.body.style.cssText = savedBody.current;
        window.scrollTo({ top: savedScroll.current, behavior: "instant" });
      }
    },
    [],
  );
  function move(direction: number) {
    const el = track.current!;
    pausedUntil.current = performance.now() + 1800;
    el.classList.remove("is-auto-scrolling");
    const next = (index + direction + items.length) % items.length;
    const target = el.children[next] as HTMLElement;
    const first = el.children[0] as HTMLElement;
    el.scrollTo({
      left: target.offsetLeft - first.offsetLeft,
      behavior: matchMedia("(prefers-reduced-motion:reduce)").matches
        ? "instant"
        : "smooth",
    });
    setIndex(next);
  }
  function open(item: Photo, event: React.MouseEvent<HTMLButtonElement>) {
    pausedUntil.current = Infinity;
    photoOpen.current = true;
    opener.current = event.currentTarget;
    setPhoto(item);
    clearTimeout(closeTimer.current);
    savedScroll.current = window.scrollY;
    savedBody.current = document.body.style.cssText;
    const width = document.documentElement.clientWidth;
    Object.assign(document.body.style, {
      position: "fixed",
      top: `-${savedScroll.current}px`,
      left: "0",
      width: `${width}px`,
    });
    dialog.current!.showModal();
    requestAnimationFrame(() => dialog.current?.classList.add("is-open"));
  }
  function close() {
    if (!photoOpen.current) return;
    dialog.current?.classList.remove("is-open");
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(
      () => {
        dialog.current?.close();
        setPhoto(null);
        photoOpen.current = false;
        document.body.style.cssText = savedBody.current;
        window.scrollTo({ top: savedScroll.current, behavior: "instant" });
        opener.current?.focus({ preventScroll: true });
        pausedUntil.current = performance.now() + 1800;
      },
      matchMedia("(prefers-reduced-motion:reduce)").matches ? 0 : 220,
    );
  }
  const photos = loop ? [...items, ...items] : items;
  return (
    <div
      className="timeline-gallery"
      onPointerEnter={() => {
        hovered.current = true;
      }}
      onPointerLeave={() => {
        hovered.current = false;
      }}
    >
      <div
        ref={track}
        className="timeline-gallery-track"
        tabIndex={0}
        aria-label={label}
        onPointerDown={() => {
          pausedUntil.current = performance.now() + 3000;
        }}
        onWheel={() => {
          pausedUntil.current = performance.now() + 1800;
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowRight" ? 1 : -1);
          }
        }}
        onScroll={() => {
          const el = track.current!;
          const a = el.children[0] as HTMLElement;
          const b = el.children[1] as HTMLElement;
          if (a && b) {
            const step = b.offsetLeft - a.offsetLeft;
            if (step) setIndex(Math.round(el.scrollLeft / step) % items.length);
          }
        }}
      >
        {photos.map((item, i) => (
          <button
            key={`${item.src}-${i}`}
            className="timeline-gallery-item"
            type="button"
            tabIndex={i >= items.length ? -1 : 0}
            aria-hidden={i >= items.length ? true : undefined}
            data-gallery-clone={i >= items.length ? "true" : undefined}
            onClick={(event) => open(item, event)}
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={320}
              height={240}
              sizes="(max-width:600px) 150px, 140px"
            />
          </button>
        ))}
      </div>
      <div
        className="timeline-gallery-controls"
        aria-label={`${label} controls`}
      >
        <button
          className="timeline-gallery-control"
          type="button"
          aria-label="Previous image"
          onClick={() => move(-1)}
        >
          ←
        </button>
        <span className="timeline-gallery-position" aria-live="off">
          {index + 1} / {items.length}
        </span>
        <button
          className="timeline-gallery-control"
          type="button"
          aria-label="Next image"
          onClick={() => move(1)}
        >
          →
        </button>
      </div>
      <dialog
        ref={dialog}
        className="gallery-lightbox"
        aria-label={photo?.alt || "Photo preview"}
        onCancel={(event) => {
          event.preventDefault();
          event.stopPropagation();
          close();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.stopPropagation();
        }}
      >
        <button
          className="lightbox-close"
          type="button"
          aria-label="Close image"
          onClick={close}
        >
          ×
        </button>
        <div className="gallery-lightbox-image">
          {photo && <img src={photo.full} alt={photo.alt} />}
        </div>
      </dialog>
    </div>
  );
}
