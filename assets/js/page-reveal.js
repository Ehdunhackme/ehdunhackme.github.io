(function () {
  'use strict';

  var root = document.documentElement;
  if (!root.classList.contains('page-loading')) return;
  var hasRevealed = false;
  var failSafe = window.setTimeout(finish, 1200);

  function finish() {
    if (hasRevealed) return;
    hasRevealed = true;
    window.clearTimeout(failSafe);
    requestAnimationFrame(function () {
      root.classList.remove('page-loading');
    });
  }

  function settleWithin(promise, limit) {
    return Promise.race([
      Promise.resolve(promise).catch(function () {}),
      new Promise(function (resolve) { window.setTimeout(resolve, limit); })
    ]);
  }

  function reveal() {
    var main = document.querySelector('body > main');
    var visibleImages = main
      ? Array.from(main.querySelectorAll('img')).filter(function (image) {
          return image.loading !== 'lazy' || image.getBoundingClientRect().top < window.innerHeight;
        })
      : [];
    var imageReady = Promise.all(visibleImages.map(function (image) {
      if (image.complete && image.naturalWidth > 0 && image.decode) return image.decode();
      if (image.complete) return Promise.resolve();
      return new Promise(function (resolve) {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      });
    }));
    var fontStylesheet = document.querySelector('link[href*="fonts.googleapis.com"]');
    var stylesheetReady = fontStylesheet && fontStylesheet.media === 'print'
      ? new Promise(function (resolve) {
          fontStylesheet.addEventListener('load', resolve, { once: true });
          fontStylesheet.addEventListener('error', resolve, { once: true });
        })
      : Promise.resolve();
    var fontsReady = stylesheetReady.then(function () {
      return document.fonts ? document.fonts.ready : undefined;
    });

    settleWithin(Promise.all([fontsReady, imageReady]), 500).then(function () {
      finish();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reveal, { once: true });
  } else {
    reveal();
  }
})();
