"use client";
import { useEffect, useRef } from "react";

export function HeroName() {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const element = ref.current!;
    const from = "Dun Li Chan",
      to = "dunl1chan",
      chinese = "曾敦礼";
    const pool = (from + to + chinese).replace(/ /g, "").split("");
    const span = Math.max(from.length, to.length, chinese.length);
    let timer: ReturnType<typeof setInterval> | undefined;
    let resetTimer: ReturnType<typeof setTimeout> | undefined;
    let nextTarget = to,
      mobileTapIndex = 0,
      lastRun = 0,
      disposed = false;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    function measure(text: string) {
      const old = element.textContent;
      element.style.width = "";
      element.textContent = text;
      const width = element.getBoundingClientRect().width;
      element.textContent = old;
      return width;
    }
    function pin() {
      if (!disposed)
        element.style.width = Math.max(measure(from), measure(to)) + "px";
    }
    function run(target: string, step = 58) {
      clearInterval(timer);
      element.classList.toggle("is-chinese", target === chinese);
      if (reduced.matches) {
        element.textContent = target;
        element.classList.remove("is-morphing");
        return;
      }
      element.classList.add("is-morphing");
      const start = performance.now();
      timer = setInterval(() => {
        const settled = Math.floor((performance.now() - start) / step);
        if (settled > span) {
          clearInterval(timer);
          element.textContent = target;
          element.classList.remove("is-morphing");
          return;
        }
        let output = "";
        for (let i = 0; i < span; i++)
          output +=
            i < settled
              ? target[i] || ""
              : i < from.length || i < target.length
                ? pool[Math.floor(Math.random() * pool.length)]
                : "";
        element.textContent = output;
      }, 65);
    }
    function next() {
      if (performance.now() - lastRun < 180) return;
      lastRun = performance.now();
      const target = nextTarget;
      nextTarget = target === to ? chinese : to;
      run(target);
    }
    const leave = () => run(from);
    const enter = () => {
      if (matchMedia("(hover:hover)").matches) next();
    };
    const click = () => {
      if (matchMedia("(max-width:600px)").matches) {
        const targets = [to, chinese, from];
        run(targets[mobileTapIndex]);
        mobileTapIndex = (mobileTapIndex + 1) % 3;
      } else next();
    };
    let lastScroll = window.scrollY,
      lastTrigger = window.scrollY;
    const scroll = () => {
      const y = window.scrollY;
      if (
        !matchMedia("(max-width:600px)").matches &&
        y - lastTrigger >= 5 &&
        y > lastScroll
      ) {
        lastTrigger = y;
        next();
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          if (!element.matches(":hover")) run(from);
        }, 1000);
      }
      lastScroll = y;
    };
    pin();
    void document.fonts.ready.then(pin);
    const intro = setTimeout(() => run(from, 180), 150);
    if (!reduced.matches) {
      element.textContent = to;
      element.classList.add("is-morphing");
    }
    element.addEventListener("pointerenter", enter);
    element.addEventListener("pointerleave", leave);
    element.addEventListener("click", click);
    window.addEventListener("resize", pin);
    window.addEventListener("scroll", scroll, { passive: true });
    return () => {
      disposed = true;
      clearInterval(timer);
      clearTimeout(intro);
      clearTimeout(resetTimer);
      element.removeEventListener("pointerenter", enter);
      element.removeEventListener("pointerleave", leave);
      element.removeEventListener("click", click);
      window.removeEventListener("resize", pin);
      window.removeEventListener("scroll", scroll);
    };
  }, []);
  return (
    <h1
      id="profile-title"
      className="hero-name"
      ref={ref}
      aria-label="Dun Li Chan"
    >
      Dun Li Chan
    </h1>
  );
}
