"use client";
import { useEffect, useRef, type RefObject } from "react";

// Keep one active card while crossing the space between cards. No React render
// is needed for pointer motion; only the previous and next attributes change.
export function useCardFocus(
  ref: RefObject<HTMLElement | null>,
  selector: string,
  revision = "",
) {
  useEffect(() => {
    const scope = ref.current;
    if (!scope) return;
    const hover = matchMedia("(hover: hover) and (pointer: fine)");
    const items = [...scope.querySelectorAll<HTMLElement>(selector)];
    let pointer: HTMLElement | null = null;
    let keyboard: HTMLElement | null = null;
    let current: HTMLElement | null = null;
    scope.setAttribute("data-focus-managed", "");
    items.forEach((item) => item.setAttribute("data-focus-item", ""));
    const visible = (item: HTMLElement | null) =>
      item && scope.contains(item) && !item.closest("[hidden]") ? item : null;
    const apply = () => {
      pointer = visible(pointer);
      keyboard = visible(keyboard);
      const next = pointer || keyboard;
      if (current !== next) {
        current?.removeAttribute("data-focus-selected");
        next?.setAttribute("data-focus-selected", "");
        current = next;
      }
      scope.toggleAttribute("data-focus-active", !!next);
    };
    const itemAt = (target: EventTarget | null) =>
      target instanceof Element
        ? visible(target.closest<HTMLElement>(selector))
        : null;
    const over = (event: PointerEvent) => {
      if (hover.matches && event.pointerType !== "touch") {
        const item = itemAt(event.target);
        if (item) {
          pointer = item;
          apply();
        }
      }
    };
    const leave = () => {
      pointer = null;
      apply();
    };
    const down = (event: PointerEvent) => {
      keyboard = null;
      if (event.pointerType === "touch") pointer = null;
      apply();
    };
    const focus = () => {
      const el = document.activeElement;
      keyboard = el?.matches(":focus-visible") ? itemAt(el) : null;
      apply();
    };
    const blur = () => queueMicrotask(focus);
    const clear = () => {
      pointer = keyboard = null;
      apply();
    };
    const visibility = () => {
      if (document.hidden) clear();
    };
    scope.addEventListener("pointerover", over);
    scope.addEventListener("pointerleave", leave);
    scope.addEventListener("pointercancel", leave);
    scope.addEventListener("pointerdown", down);
    scope.addEventListener("focusin", focus);
    scope.addEventListener("focusout", blur);
    window.addEventListener("blur", clear);
    hover.addEventListener("change", clear);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clear();
      scope.removeAttribute("data-focus-managed");
      items.forEach((item) => item.removeAttribute("data-focus-item"));
      scope.removeEventListener("pointerover", over);
      scope.removeEventListener("pointerleave", leave);
      scope.removeEventListener("pointercancel", leave);
      scope.removeEventListener("pointerdown", down);
      scope.removeEventListener("focusin", focus);
      scope.removeEventListener("focusout", blur);
      window.removeEventListener("blur", clear);
      hover.removeEventListener("change", clear);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [ref, selector, revision]);
}
export function FocusScope({
  children,
  className,
  selector,
}: {
  children: React.ReactNode;
  className?: string;
  selector: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useCardFocus(ref, selector);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
