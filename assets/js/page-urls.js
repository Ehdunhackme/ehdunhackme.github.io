(function () {
  'use strict';

  // Directory URLs need a web server. Keep file:// previews unchanged.
  if (!/^https?:$/.test(window.location.protocol)) return;

  function cleanPageUrl(url) {
    if (url.origin !== window.location.origin) return null;
    if (!/(?:\/index\.html|\/)$/.test(url.pathname)) return null;
    url.pathname = url.pathname.replace(/index\.html$/, '');
    if (!url.hash) url.hash = 'index';
    return url.pathname + url.search + url.hash;
  }

  var current = cleanPageUrl(new URL(window.location.href));
  if (current && current !== window.location.pathname + window.location.search + window.location.hash) {
    window.history.replaceState(window.history.state, '', current);
  }

  document.querySelectorAll('a[href]').forEach(function (link) {
    var href = link.getAttribute('href');
    // Preserve same-page anchors and external/non-web links.
    if (!href || href.charAt(0) === '#') return;
    var clean = cleanPageUrl(new URL(href, window.location.href));
    if (clean) link.setAttribute('href', clean);
  });
})();
