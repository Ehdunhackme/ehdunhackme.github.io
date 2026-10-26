(function () {
      'use strict';
      var lightbox = document.getElementById('gallery-lightbox');
      var lightboxImage = document.getElementById('lightbox-image');
      var galleryTracks = Array.from(document.querySelectorAll('.timeline-gallery-track'));
      var gallerySpeed = 26;
      var galleryStates = new Map();
      var activeGalleryTrack = null;
      var lightboxCloseTimer = null;
      var lightboxScrollY = 0;
      var bodyLockStyles = null;
      function lockPageScroll() {
        var body = document.body;
        lightboxScrollY = window.scrollY || window.pageYOffset;
        var pageWidth = document.documentElement.clientWidth;
        bodyLockStyles = {
          position: body.style.position,
          top: body.style.top,
          left: body.style.left,
          right: body.style.right,
          width: body.style.width
        };
        body.style.position = 'fixed';
        body.style.top = '-' + lightboxScrollY + 'px';
        body.style.left = '0';
        body.style.right = 'auto';
        // Keep the pre-lock content width. A percentage width expands when the
        // page scrollbar disappears, making the underlying layout jump sideways.
        body.style.width = pageWidth + 'px';
        body.classList.add('lightbox-open');
      }
      function unlockPageScroll() {
        var body = document.body;
        body.classList.remove('lightbox-open');
        if (bodyLockStyles) {
          body.style.position = bodyLockStyles.position;
          body.style.top = bodyLockStyles.top;
          body.style.left = bodyLockStyles.left;
          body.style.right = bodyLockStyles.right;
          body.style.width = bodyLockStyles.width;
        }
        var root = document.documentElement;
        var previousScrollBehavior = root.style.scrollBehavior;
        root.style.scrollBehavior = 'auto';
        window.scrollTo(0, lightboxScrollY);
        root.style.scrollBehavior = previousScrollBehavior;
        bodyLockStyles = null;
      }
      function visibleGalleryItems() { return window.matchMedia('(max-width: 600px)').matches ? 2 : 5; }
      function originalGalleryItems(track) {
        return Array.from(track.children).filter(function (item) { return !item.hasAttribute('data-gallery-clone'); });
      }
      function allGalleryItems(track) { return Array.from(track.children); }
      function galleryIndex(track) {
        var state = galleryStates.get(track);
        var originals = originalGalleryItems(track);
        var items = allGalleryItems(track);
        if (!state || !originals.length) return 0;
        var step = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : 0;
        var loopWidth = state.loopWidth || (items[originals.length] && items[originals.length].offsetLeft) || 0;
        var position = track.scrollLeft;
        if (loopWidth > 0) position = ((position % loopWidth) + loopWidth) % loopWidth;
        if (!step) return 0;
        return Math.round(position / step) % originals.length;
      }
      function updateGalleryPosition(track) {
        var state = galleryStates.get(track);
        if (!state || !state.positionLabel) return;
        var originals = originalGalleryItems(track);
        if (!originals.length) return;
        var currentIndex = state.navigationIndex === null ? galleryIndex(track) : state.navigationIndex;
        if (state.currentIndex === currentIndex) return;
        state.currentIndex = currentIndex;
        state.positionLabel.textContent = (currentIndex + 1) + ' / ' + originals.length;
      }
      function scrollToGalleryItem(track, item, behavior) {
        if (!item) return;
        if (typeof track.scrollTo === 'function') track.scrollTo({ left: item.offsetLeft, behavior: behavior });
        else track.scrollLeft = item.offsetLeft;
      }
      function scheduleGalleryResume(track, delay) {
        var state = galleryStates.get(track);
        if (!state) return;
        clearTimeout(state.resumeTimer);
        state.resumeTimer = window.setTimeout(function () {
          state.resumeTimer = null;
          startGallery(track);
        }, delay || 1800);
      }
      function moveGallery(track, direction) {
        var state = galleryStates.get(track);
        var originals = originalGalleryItems(track);
        var items = allGalleryItems(track);
        if (!state || originals.length < 2) return;
        pauseGallery(track);
        var currentIndex = state.navigationIndex === null ? galleryIndex(track) : state.navigationIndex;
        var targetIndex = currentIndex + direction;
        var wrappedBackward = targetIndex < 0;
        if (wrappedBackward && items[originals.length]) {
          track.scrollLeft = state.loopWidth || items[originals.length].offsetLeft;
        }
        if (targetIndex < 0) targetIndex = originals.length - 1;
        var wrappedForward = targetIndex >= originals.length;
        var target = wrappedForward && items[originals.length] ? items[originals.length] : wrappedBackward && items[originals.length * 2 - 1] ? items[originals.length * 2 - 1] : originals[targetIndex % originals.length];
        state.navigationIndex = ((targetIndex % originals.length) + originals.length) % originals.length;
        updateGalleryPosition(track);
        scrollToGalleryItem(track, target, 'smooth');
        clearTimeout(state.wrapTimer);
        state.wrapTimer = window.setTimeout(function () {
          if (wrappedForward && items[originals.length]) scrollToGalleryItem(track, originals[0], 'auto');
          if (wrappedBackward && items[originals.length * 2 - 1]) scrollToGalleryItem(track, originals[originals.length - 1], 'auto');
          updateGalleryPosition(track);
        }, 500);
        window.setTimeout(function () { updateGalleryPosition(track); }, 450);
        scheduleGalleryResume(track);
      }
      function setupGalleryControls(track) {
        var gallery = track.parentElement;
        var controls = gallery.querySelector('.timeline-gallery-controls');
        if (controls) controls.remove();
        controls = document.createElement('div');
        controls.className = 'timeline-gallery-controls';
        controls.setAttribute('aria-label', (track.getAttribute('aria-label') || 'Gallery') + ' controls');
        var previous = document.createElement('button');
        previous.className = 'timeline-gallery-control';
        previous.type = 'button';
        previous.setAttribute('aria-label', 'Previous image');
        previous.textContent = '←';
        var position = document.createElement('span');
        position.className = 'timeline-gallery-position';
        position.setAttribute('aria-live', 'polite');
        var next = document.createElement('button');
        next.className = 'timeline-gallery-control';
        next.type = 'button';
        next.setAttribute('aria-label', 'Next image');
        next.textContent = '→';
        controls.append(previous, position, next);
        gallery.appendChild(controls);
        var state = galleryStates.get(track);
        state.positionLabel = position;
        controls.addEventListener('pointerdown', function () { pauseGallery(track); });
        previous.addEventListener('click', function () { moveGallery(track, -1); });
        next.addEventListener('click', function () { moveGallery(track, 1); });
        updateGalleryPosition(track);
      }
      function syncGalleryLoop(track) {
        var originals = originalGalleryItems(track);
        var clones = Array.from(track.querySelectorAll('[data-gallery-clone="true"]'));
        var shouldLoop = originals.length > visibleGalleryItems();
        if (shouldLoop && !clones.length) {
          originals.forEach(function (item) {
            var clone = item.cloneNode(true);
            clone.setAttribute('data-gallery-clone', 'true');
            clone.setAttribute('aria-hidden', 'true');
            clone.tabIndex = -1;
            track.appendChild(clone);
          });
        } else if (!shouldLoop && clones.length) {
          clones.forEach(function (clone) { clone.remove(); });
          track.scrollLeft = 0;
        }
      }
      function pauseGallery(track) {
        var state = galleryStates.get(track);
        if (!state) return;
        clearTimeout(state.resumeTimer);
        state.resumeTimer = null;
        if (state.frame) cancelAnimationFrame(state.frame);
        state.frame = null;
        state.last = 0;
        state.position = track.scrollLeft;
        track.classList.remove('is-auto-scrolling');
      }
      function startGallery(track) {
        var gallery = track.parentElement;
        if (track.closest('[hidden]')) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || gallery.matches(':hover')) return;
        var state = galleryStates.get(track);
        if (!state || state.resumeTimer) return;
        var clone = track.querySelector('[data-gallery-clone="true"]');
        if (!clone || track.scrollWidth <= track.clientWidth + 1) return;
        state.navigationIndex = null;
        updateGalleryPosition(track);
        pauseGallery(track);
        state.loopWidth = clone.offsetLeft;
        state.position = track.scrollLeft >= state.loopWidth ? track.scrollLeft - state.loopWidth : track.scrollLeft;
        track.classList.add('is-auto-scrolling');
        function drift(timestamp) {
          if (!state.last) state.last = timestamp;
          var elapsed = Math.min(timestamp - state.last, 50);
          state.last = timestamp;
          state.position += gallerySpeed * elapsed / 1000;
          if (state.position >= state.loopWidth) state.position -= state.loopWidth;
          track.scrollLeft = state.position;
          state.frame = requestAnimationFrame(drift);
        }
        state.frame = requestAnimationFrame(drift);
      }
      galleryTracks.forEach(function (track) {
        galleryStates.set(track, { frame: null, last: 0, position: 0, loopWidth: 0, currentIndex: -1, navigationIndex: null, positionLabel: null, resumeTimer: null, wrapTimer: null });
        syncGalleryLoop(track);
        setupGalleryControls(track);
        var gallery = track.parentElement;
        gallery.addEventListener('mouseenter', function () { pauseGallery(track); });
        gallery.addEventListener('mouseleave', function () { startGallery(track); });
        track.addEventListener('focusin', function () { pauseGallery(track); });
        track.addEventListener('focusout', function () { startGallery(track); });
        track.addEventListener('pointerdown', function () {
          galleryStates.get(track).navigationIndex = null;
          pauseGallery(track);
        });
        track.addEventListener('pointerup', function (event) {
          var item = event.target.closest('.timeline-gallery-item');
          if (event.pointerType !== 'mouse' || !item) scheduleGalleryResume(track);
        });
        track.addEventListener('pointercancel', function () { scheduleGalleryResume(track); });
        track.addEventListener('wheel', function () {
          galleryStates.get(track).navigationIndex = null;
          pauseGallery(track);
          scheduleGalleryResume(track);
        }, { passive: true });
        track.addEventListener('scroll', function () { updateGalleryPosition(track); }, { passive: true });
        track.addEventListener('click', function (event) {
          var button = event.target.closest('.timeline-gallery-item');
          if (!button || !track.contains(button)) return;
          var image = button.querySelector('img');
          lightboxImage.src = image.src;
          lightboxImage.alt = image.alt;
          activeGalleryTrack = track;
          lightbox.classList.remove('is-closing');
          lightbox.hidden = false;
          window.requestAnimationFrame(function () { lightbox.classList.add('is-open'); });
          lockPageScroll();
          pauseGallery(track);
        });
        track.addEventListener('keydown', function (event) {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            moveGallery(track, event.key === 'ArrowRight' ? 1 : -1);
          }
        });
        updateGalleryPosition(track);
        startGallery(track);
      });
      function closeLightbox() {
        if (lightbox.hidden || lightbox.classList.contains('is-closing')) return;
        lightbox.classList.remove('is-open');
        lightbox.classList.add('is-closing');
        clearTimeout(lightboxCloseTimer);
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finishLightboxClose();
        else lightboxCloseTimer = window.setTimeout(finishLightboxClose, 300);
      }
      function finishLightboxClose() {
        if (lightbox.hidden || !lightbox.classList.contains('is-closing')) return;
        clearTimeout(lightboxCloseTimer);
        lightbox.hidden = true;
        lightbox.classList.remove('is-closing');
        lightboxImage.removeAttribute('src');
        unlockPageScroll();
        if (activeGalleryTrack) scheduleGalleryResume(activeGalleryTrack, 900);
        activeGalleryTrack = null;
      }
      lightbox.addEventListener('transitionend', function (event) {
        if (event.target === lightbox && event.propertyName === 'opacity' && lightbox.classList.contains('is-closing')) finishLightboxClose();
      });
      window.addEventListener('resize', function () {
        galleryTracks.forEach(function (track) { pauseGallery(track); syncGalleryLoop(track); startGallery(track); });
      });
      document.addEventListener('about-section-change', function () {
        galleryTracks.forEach(function (track) { pauseGallery(track); syncGalleryLoop(track); startGallery(track); });
      });
      document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
      lightbox.addEventListener('click', function (event) { if (event.target === lightbox) closeLightbox(); });
      document.addEventListener('keydown', function (event) { if (event.key === 'Escape') closeLightbox(); });
    })();
