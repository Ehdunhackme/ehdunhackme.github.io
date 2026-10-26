(function () {
  'use strict';
  var hover = window.matchMedia('(hover: hover) and (pointer: fine)');
  var groups = [
    ['.about-reader .timeline', '.timeline-item'],
    ['.paper-showcase-scope', '.paper-list > .paper-showcase'],
    ['.writing-card-list', '.writing-section-link']
  ];
  groups.forEach(function (group) {
    document.querySelectorAll(group[0]).forEach(function (scope) {
      var pointer = null;
      var keyboard = null;
      var items = [];
      scope.setAttribute('data-focus-managed', '');
      function visible(item) {
        return item && scope.contains(item) && !item.closest('[hidden]') ? item : null;
      }
      function apply() {
        pointer = visible(pointer);
        keyboard = visible(keyboard);
        var active = pointer || keyboard;
        scope.toggleAttribute('data-focus-active', Boolean(active));
        items.forEach(function (item) {
          item.toggleAttribute('data-focus-selected', item === active);
        });
      }
      function refresh() {
        items = Array.from(scope.querySelectorAll(group[1]));
        items.forEach(function (item) { item.setAttribute('data-focus-item', ''); });
        apply();
      }
      function itemAt(target) {
        return target instanceof Element ? visible(target.closest(group[1])) : null;
      }
      scope.addEventListener('pointerover', function (event) {
        if (!hover.matches || event.pointerType === 'touch') return;
        var item = itemAt(event.target);
        // Gaps keep the existing selection; only entering another item changes it.
        if (item && item !== pointer) { pointer = item; apply(); }
      });
      scope.addEventListener('pointerleave', function () { pointer = null; apply(); });
      scope.addEventListener('pointercancel', function () { pointer = null; apply(); });
      scope.addEventListener('pointerdown', function (event) {
        keyboard = null;
        if (event.pointerType === 'touch') pointer = null;
        apply();
      });
      scope.addEventListener('focusin', function (event) {
        keyboard = event.target.matches(':focus-visible') ? itemAt(event.target) : null;
        apply();
      });
      scope.addEventListener('focusout', function () {
        queueMicrotask(function () {
          var focused = document.activeElement;
          keyboard = focused && focused.matches(':focus-visible') ? itemAt(focused) : null;
          apply();
        });
      });
      function clear() { pointer = null; keyboard = null; apply(); }
      hover.addEventListener('change', clear);
      window.addEventListener('blur', clear);
      document.addEventListener('visibilitychange', function () { if (document.hidden) clear(); });
      document.addEventListener('about-section-change', refresh);
      scope.addEventListener('directory-content-ready', refresh);
      scope.addEventListener('input', apply);
      refresh();
    });
  });
})();
