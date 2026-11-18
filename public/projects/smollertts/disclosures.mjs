// Keep native details/summary keyboard behavior while animating both directions.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
export function animateDisclosures(root = document) {
  for (const details of root.querySelectorAll('details')) {
    const summary = details.querySelector(':scope > summary');
    const content = details.querySelector(':scope > .disclosure-content');
    if (!summary || !content) continue;
    let expanded = details.open, animation;
    const settle = () => {
      animation?.cancel(); animation = null;
      details.open = expanded;
      details.style.overflow = '';
      summary.setAttribute('aria-expanded', String(expanded));
      content.inert = !expanded;
    };
    settle();
    summary.addEventListener('click', event => {
      event.preventDefault();
      const start = details.getBoundingClientRect().height;
      animation?.cancel();
      expanded = !expanded;
      summary.setAttribute('aria-expanded', String(expanded));
      content.inert = !expanded;
      if (reducedMotion.matches) {settle(); return;}
      // Keep the content rendered until a closing animation has finished.
      details.open = true;
      const end = expanded ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height;
      details.style.overflow = 'hidden';
      animation = details.animate([{height: `${start}px`}, {height: `${end}px`}],
        {duration: 260, easing: 'cubic-bezier(.22,1,.36,1)'});
      animation.onfinish = settle;
    });
    reducedMotion.addEventListener('change', () => {if (reducedMotion.matches) settle();});
  }
}
