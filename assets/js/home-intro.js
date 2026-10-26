(function () {
      'use strict';

      // Keep former project and writing anchors pointing to their dedicated pages.
      var legacySections = {
        '#research': 'projects/index.html',
        '#writings': 'writings/index.html'
      };
      var destination = legacySections[window.location.hash];
      if (destination) {
        window.location.replace(new URL(destination, document.baseURI).href);
        return;
      }

      var root = document.documentElement;
      var toggle = document.getElementById('theme-toggle');
      toggle.addEventListener('click', function () {
        root.classList.toggle('dark');
        localStorage.setItem('theme', root.classList.contains('dark') ? 'dark' : 'light');
        toggle.setAttribute('aria-label', 'Switch to ' + (root.classList.contains('dark') ? 'light' : 'dark') + ' mode');
      });
      toggle.setAttribute('aria-label', 'Switch to ' + (root.classList.contains('dark') ? 'light' : 'dark') + ' mode');

      var heroName = document.getElementById('profile-title');
      function setupNameMorph(element) {
        var from = element.textContent;
        var to = element.getAttribute('data-alt');
        var chinese = element.getAttribute('data-chinese') || from;
        var pool = (from + to + chinese).replace(/ /g, '').split('');
        var span = Math.max(from.length, to.length, chinese.length);
        var timer = null;
        var settleAt = 0;
        var nextTarget = to;
        var mobileTapIndex = 0;
        var lastRunAt = 0;
        var morphCooldown = 180;

        function measure(text) {
          var previous = element.textContent;
          element.style.width = '';
          element.textContent = text;
          var width = element.getBoundingClientRect().width;
          element.textContent = previous;
          return width;
        }

        function pinWidth() {
          element.style.width = Math.max(measure(from), measure(to)).toFixed(2) + 'px';
        }

        function render(target) {
          var output = '';
          for (var i = 0; i < span; i += 1) {
            if (i < settleAt) output += target[i] || '';
            else if (i < from.length || i < target.length) output += pool[Math.floor(Math.random() * pool.length)];
          }
          element.textContent = output;
        }

        function run(target, stepDuration) {
          clearInterval(timer);
          element.classList.add('is-morphing');
          element.classList.toggle('is-chinese', target === chinese);
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            element.textContent = target;
            element.classList.remove('is-morphing');
            return;
          }
          settleAt = 0;
          var started = Date.now();
          timer = setInterval(function () {
            settleAt = Math.floor((Date.now() - started) / (stepDuration || 58));
            if (settleAt > span) {
              clearInterval(timer);
              element.textContent = target;
              element.classList.remove('is-morphing');
              return;
            }
            render(target);
          }, 65);
        }

        function runNext() {
          var now = Date.now();
          if (now - lastRunAt < morphCooldown) return;
          lastRunAt = now;
          var target = nextTarget;
          nextTarget = target === to ? chinese : to;
          run(target);
        }

        function runMobileTapCycle() {
          var targets = [to, chinese, from];
          var target = targets[mobileTapIndex];
          mobileTapIndex = (mobileTapIndex + 1) % targets.length;
          run(target);
        }

        pinWidth();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(pinWidth);
        window.addEventListener('resize', pinWidth);

        element.textContent = to;
        element.classList.add('is-morphing');
        window.setTimeout(function () { run(from, 180); }, 150);

        if (window.matchMedia('(hover: hover)').matches) {
          element.addEventListener('pointerenter', runNext);
          element.addEventListener('pointerleave', function () { run(from); });
        }
        element.addEventListener('click', function () {
          if (window.matchMedia('(max-width: 600px)').matches) runMobileTapCycle();
          else runNext();
        });

        var lastScrollY = window.scrollY;
        var lastTriggerY = window.scrollY;
        var resetTimer = null;
        function handleScroll() {
          var currentScrollY = window.scrollY;
          if (window.matchMedia('(max-width: 600px)').matches) {
            lastScrollY = currentScrollY;
            return;
          }
          if (currentScrollY - lastTriggerY >= 5 && currentScrollY > lastScrollY) {
            lastTriggerY = currentScrollY;
            runNext();
            clearTimeout(resetTimer);
            resetTimer = window.setTimeout(function () {
              if (!element.matches(':hover')) run(from);
            }, 1000);
          }
          lastScrollY = currentScrollY;
        }
        window.addEventListener('scroll', handleScroll, { passive: true });
      }

      if (heroName) setupNameMorph(heroName);


})();
