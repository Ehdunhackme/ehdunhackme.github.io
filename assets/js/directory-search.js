(function () {
  'use strict';

  function normalize(value) {
    return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }

  document.querySelectorAll('[data-directory-search]').forEach(function (directory) {
    var form = directory.querySelector('.directory-search');
    var input = form.querySelector('input');
    var clear = form.querySelector('[data-search-clear]');
    var status = form.querySelector('[data-search-status]');
    var empty = directory.querySelector('[data-search-empty]');
    var items = Array.from(directory.querySelectorAll('.paper-list > li, .writing-card-list > li'));
    var groups = Array.from(directory.querySelectorAll('[data-search-group]'));

    function filter() {
      var query = normalize(input.value);
      var words = query ? query.split(/\s+/) : [];
      var count = 0;
      items.forEach(function (item) {
        var text = normalize(item.textContent);
        var matches = words.every(function (word) { return text.indexOf(word) !== -1; });
        item.hidden = !matches;
        if (matches) count += 1;
      });
      groups.forEach(function (group) {
        group.hidden = !items.some(function (item) { return group.contains(item) && !item.hidden; });
      });
      clear.hidden = input.value.length === 0;
      empty.hidden = count !== 0;
      status.textContent = query
        ? count + ' of ' + items.length + ' ' + (items.length === 1 ? 'entry' : 'entries')
        : items.length + ' ' + (items.length === 1 ? 'entry' : 'entries');
    }

    form.addEventListener('submit', function (event) { event.preventDefault(); });
    input.addEventListener('input', filter);
    input.addEventListener('search', filter);
    input.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        input.value = '';
        filter();
      }
    });
    clear.addEventListener('click', function () {
      input.value = '';
      filter();
      input.focus();
    });
    // Explanations are added asynchronously; keep an active search in sync.
    directory.addEventListener('directory-content-ready', filter);
    form.hidden = false;
    filter();
  });
})();
