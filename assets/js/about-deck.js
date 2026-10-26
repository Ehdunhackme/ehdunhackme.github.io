(function () {
  'use strict';
  var deck = document.getElementById('about-deck');
  var reader = document.getElementById('about-reader');
  if (!deck || !reader) return;
  var intro = Array.from(document.querySelectorAll('.intro-block, .home-introduction'));
  var cards = Array.from(deck.querySelectorAll('[data-section]'));
  var panels = cards.map(function (card) { return document.getElementById(card.dataset.section); });
  var toolbar = reader.querySelector('.deck-toolbar');
  var back = reader.querySelector('.deck-return');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var active = null;
  var lastCard = cards[0];
  var busy = false;
  var revision = 0;
  var animations = [];

  function animate(element, frames, duration, easing) {
    if (reduced.matches || !element.animate) return Promise.resolve();
    var animation = element.animate(frames, {
      duration: duration, easing: easing || 'cubic-bezier(.22,.7,.25,1)', fill: 'both'
    });
    animations.push(animation);
    return animation.finished.catch(function () {});
  }
  function clearAnimations() {
    animations.forEach(function (animation) { animation.cancel(); });
    animations = [];
  }
  function show(id) {
    active = id;
    intro.forEach(function (section) { section.hidden = Boolean(id); });
    deck.hidden = Boolean(id);
    reader.hidden = !id;
    panels.forEach(function (panel) { panel.hidden = panel.id !== id; });
    cards.forEach(function (card) {
      card.setAttribute('aria-expanded', String(card.dataset.section === id));
    });
    if (id) {
      lastCard = cards.find(function (card) { return card.dataset.section === id; });
    }
    // The galleries must remeasure when their previously hidden panel is revealed.
    document.dispatchEvent(new Event('about-section-change'));
  }
  function focusView() {
    var target = active ? document.getElementById(active).querySelector('h2') : lastCard;
    if (active) target.tabIndex = -1;
    target.focus({ preventScroll: true });
    (active ? reader : deck).scrollIntoView({ block: 'start', behavior: 'instant' });
  }
  async function navigate(id, updateUrl, motion, focus) {
    var ticket = ++revision;
    clearAnimations();
    busy = true;
    var from = active;
    var selected = cards.find(function (card) { return card.dataset.section === id; });
    var moving = motion && !reduced.matches;
    if (updateUrl) {
      var nextHash = '#' + (id || 'about-deck');
      if (location.hash !== nextHash) history.pushState(null, '', nextHash);
    }
    deck.inert = true;
    reader.inert = true;
    if (moving) {
      if (!from && selected) {
        await Promise.all(cards.map(function (card) {
          return card === selected
            ? animate(card.querySelector('.card-turn'), [
              { transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }
            ], 280)
            : animate(card, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(8px)' }], 260, 'ease-in-out');
        }));
      } else if (from) {
        await animate(reader, [{ opacity: 1 }, { opacity: 0 }], 260, 'ease-in-out');
      }
    }
    if (ticket !== revision) return;
    clearAnimations();
    show(id);
    if (focus) focusView();
    if (moving) {
      if (id) {
        await animate(reader, [
          { opacity: 0, transform: 'translateY(5px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], 360, 'ease-in-out');
      } else {
        await Promise.all([
          animate(deck, [{ opacity: 0 }, { opacity: 1 }], 360, 'ease-in-out'),
          animate(lastCard.querySelector('.card-turn'), [
            { transform: 'rotateY(180deg)' }, { transform: 'rotateY(0deg)' }
          ], 300)
        ]);
      }
    }
    if (ticket !== revision) return;
    clearAnimations();
    busy = false;
    deck.inert = false;
    reader.inert = false;
    if (focus) {
      var target = id ? document.getElementById(id).querySelector('h2') : lastCard;
      target.focus({ preventScroll: true });
    }
  }
  function sectionFromHash() {
    var target = document.getElementById(location.hash.slice(1));
    var panel = target && target.closest('.about-reader > .content-section');
    return panel ? panel.id : null;
  }
  cards.forEach(function (card) {
    card.addEventListener('click', function () {
      if (!busy) navigate(card.dataset.section, true, true, true);
    });
  });
  back.addEventListener('click', function () {
    if (!busy) navigate(null, true, true, true);
  });
  document.addEventListener('keydown', function (event) {
    var lightbox = document.getElementById('gallery-lightbox');
    if (event.key === 'Escape' && active && !busy && (!lightbox || lightbox.hidden)) {
      navigate(null, true, true, true);
    }
  });
  window.addEventListener('hashchange', function () {
    var id = sectionFromHash();
    var animateTransition = Boolean(id) || Boolean(active);
    navigate(id, false, animateTransition, animateTransition);
  });
  toolbar.hidden = false;
  show(sectionFromHash());
})();
