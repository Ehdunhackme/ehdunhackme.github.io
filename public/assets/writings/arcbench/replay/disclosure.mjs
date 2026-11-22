// Match the portfolio's existing slide-and-fade disclosures.
export function mountDisclosure(details) {
  const summary = details.querySelector(":scope > summary");
  const content = details.querySelector(":scope > .disclosure-body");
  let targetOpen = details.open;
  let animations = [];
  const cancel = () => {
    for (const animation of animations) {
      animation.onfinish = null;
      animation.cancel();
    }
    animations = [];
    details.classList.remove("is-animating");
  };
  const toggle = (event) => {
    event.preventDefault();
    const start = details.getBoundingClientRect().height;
    const opacity = details.open ? getComputedStyle(content).opacity : "0";
    targetOpen = !targetOpen;
    cancel();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      details.open = targetOpen;
      return;
    }
    details.open = true;
    const end = targetOpen
      ? details.getBoundingClientRect().height
      : summary.getBoundingClientRect().height;
    details.classList.add("is-animating");
    const options = {
      duration: 220,
      easing: "cubic-bezier(.2,.7,.2,1)",
      fill: "both",
    };
    const expand = details.animate(
      [{ height: `${start}px` }, { height: `${end}px` }],
      options,
    );
    animations = [
      expand,
      content.animate([{ opacity }, { opacity: targetOpen ? 1 : 0 }], options),
    ];
    expand.onfinish = () => {
      details.open = targetOpen;
      cancel();
    };
  };
  const sync = () => {
    if (!animations.length) targetOpen = details.open;
  };
  summary.addEventListener("click", toggle);
  details.addEventListener("toggle", sync);
  return () => {
    cancel();
    summary.removeEventListener("click", toggle);
    details.removeEventListener("toggle", sync);
  };
}
