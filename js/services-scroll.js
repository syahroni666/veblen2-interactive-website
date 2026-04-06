/* ============================================
   Services section — wheel-snap scene transitions
   Plays once per page load. After bird's eye,
   it stays permanently. Only refresh resets.
   ============================================ */
(function () {
  var wrapper, section, scenes;
  var current = 0;
  var TOTAL = 7;
  var isActive = false;
  var animating = false;
  var completed = false;
  var scrollAtRelease = 0;
  var EXIT_MS = 500;
  var ENTER_MS = 1000;
  var LOCK_MS = EXIT_MS + ENTER_MS;


  function init() {
    wrapper = document.getElementById('services-scroll-wrapper');
    section = document.getElementById('services-section');
    if (!wrapper || !section) return;

    // Mobile: skip animation entirely — show bird's-eye view only
    if (window.innerWidth <= 900) {
      var birdseye = document.getElementById('svc-birdseye');
      if (birdseye) birdseye.classList.add('svc-active');
      var fi = document.querySelector('.svc-tl-item[data-stage="1"]');
      var fd = document.querySelector('.svc-tl-desc[data-for="1"]');
      if (fi) fi.classList.add('tl-active');
      if (fd) fd.classList.add('tl-desc-active');
      return; // no scroll/wheel listeners, no fixed overlay
    }

    scenes = [
      document.getElementById('svc-scene-title'),
      document.getElementById('svc-stage-1'),
      document.getElementById('svc-stage-2'),
      document.getElementById('svc-stage-3'),
      document.getElementById('svc-stage-4'),
      document.getElementById('svc-stage-5'),
      document.getElementById('svc-birdseye')
    ];

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: false });

    var touchStartY = 0;
    window.addEventListener('touchstart', function (e) {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchend', function (e) {
      if (!isActive || animating) return;
      var dy = touchStartY - e.changedTouches[0].clientY;
      if (dy > 40) step(1);
      else if (dy < -40) step(-1);
    }, { passive: true });

    onScroll();
  }

  function clearAllScenes() {
    for (var i = 0; i < TOTAL; i++) {
      var el = scenes[i];
      if (!el) continue;
      el.classList.remove('svc-active', 'svc-left', 'svc-right');
      el.removeAttribute('style');
    }
  }

  function showSceneInstant(index) {
    for (var i = 0; i < TOTAL; i++) {
      var el = scenes[i];
      if (!el) continue;
      el.classList.remove('svc-active', 'svc-left', 'svc-right');
      el.removeAttribute('style');
      el.style.transition = 'none';
      if (i === index) {
        el.style.opacity = '1';
        el.style.transform = 'translateX(0)';
        el.classList.add('svc-active');
      } else if (i < index) {
        el.classList.add('svc-left');
      } else {
        el.classList.add('svc-right');
      }
      void el.offsetWidth;
      el.style.transition = '';
      el.style.opacity = '';
      el.style.transform = '';
    }
  }

  function activate() {
    isActive = true;
    animating = false;

    // Snap scroll to exact wrapper top so the fixed overlay covers the full viewport
    var wrapperTop = wrapper.getBoundingClientRect().top + window.pageYOffset;
    window.scrollTo(0, wrapperTop);

    if (typeof lenis !== 'undefined' && lenis && lenis.stop) lenis.stop();
    document.body.style.overflow = 'hidden';

    section.classList.remove('released', 'scroll-static');
    section.style.transform = '';

    current = 0;
    showSceneInstant(current);
    section.classList.add('active');
    wrapper.classList.add('svc-pinned');
  }

  function onScroll() {
    if (completed || !isActive) return;

    // Safety: if wrapper somehow scrolls out of view while active, deactivate
    var rect = wrapper.getBoundingClientRect();
    var winH = window.innerHeight;
    if (rect.top > winH || rect.bottom < 0) {
      isActive = false;
      animating = false;
      section.style.transition = 'none';
      section.classList.remove('active', 'released', 'scroll-static');
      section.style.transform = '';
      clearAllScenes();
      void section.offsetWidth;
      section.style.transition = '';
      wrapper.classList.remove('svc-pinned');
      document.body.style.overflow = '';
      if (typeof lenis !== 'undefined' && lenis && lenis.start) lenis.start();
    }
  }


  function step(dir) {
    if (!dir) dir = 1;
    var next = current + dir;

    if (next < 0) {
      // At scene 0 scrolling up — deactivate, let user scroll back to about
      isActive = false;
      animating = false;
      wrapper.classList.remove('svc-pinned');
      section.style.transition = 'none';
      section.classList.remove('active', 'released', 'scroll-static');
      section.style.transform = '';
      section.style.opacity = '0';
      clearAllScenes();
      void section.offsetWidth;
      section.style.transition = '';
      section.style.opacity = '';
      document.body.style.overflow = '';
      if (typeof lenis !== 'undefined' && lenis && lenis.start) lenis.start();
      return;
    }
    if (next >= TOTAL) {
      // Done — permanently completed
      completed = true;
      isActive = false;
      scrollAtRelease = window.pageYOffset;
      section.classList.remove('active');
      section.classList.add('scroll-static');
      wrapper.classList.remove('svc-pinned');
      document.body.style.overflow = '';
      if (typeof lenis !== 'undefined' && lenis && lenis.start) lenis.start();
      return;
    }

    animating = true;
    var oldEl = scenes[current];
    var newEl = scenes[next];

    oldEl.removeAttribute('style');
    oldEl.classList.remove('svc-active');
    oldEl.classList.add(dir > 0 ? 'svc-left' : 'svc-right');

    setTimeout(function () {
      newEl.classList.remove('svc-left', 'svc-right', 'svc-active');
      newEl.removeAttribute('style');
      newEl.style.transition = 'none';
      newEl.style.opacity = '0';
      newEl.style.transform = dir > 0 ? 'translateX(80px)' : 'translateX(-80px)';
      void newEl.offsetWidth;

      newEl.removeAttribute('style');
      newEl.classList.add('svc-active');

      current = next;

      // Auto-select stage 01 when bird's eye (scene 6) appears
      if (next === 6) {
        setTimeout(function () {
          var firstItem = document.querySelector('.svc-tl-item[data-stage="1"]');
          var firstDesc = document.querySelector('.svc-tl-desc[data-for="1"]');
          if (firstItem) firstItem.classList.add('tl-active');
          if (firstDesc) firstDesc.classList.add('tl-desc-active');
        }, 400);
      }
    }, EXIT_MS);

    setTimeout(function () {
      animating = false;
    }, LOCK_MS);
  }

  function onWheel(e) {
    if (completed) return;

    if (!isActive) {
      // Activate on first downward wheel when wrapper is in view
      if (e.deltaY > 0) {
        var rect = wrapper.getBoundingClientRect();
        var winH = window.innerHeight;
        if (rect.top <= 1 && rect.bottom > winH * 0.5) {
          e.preventDefault();
          activate();
        }
      }
      return;
    }

    if (animating) { e.preventDefault(); return; }
    e.preventDefault();
    if (e.deltaY > 0) step(1);
    else if (e.deltaY < 0) step(-1);
  }

  /* --- Bird's-eye clickable stages --- */
  function initBirdseye() {
    var items = document.querySelectorAll('.svc-tl-item[data-stage]');
    var descs = document.querySelectorAll('.svc-tl-desc[data-for]');

    items.forEach(function (item) {
      item.addEventListener('click', function () {
        var stage = item.getAttribute('data-stage');

        // Toggle: click same item again to close
        if (item.classList.contains('tl-active')) {
          item.classList.remove('tl-active');
          descs.forEach(function (d) { d.classList.remove('tl-desc-active'); });
          return;
        }

        // Deactivate all instantly (no fade out)
        items.forEach(function (it) { it.classList.remove('tl-active'); });
        descs.forEach(function (d) {
          d.style.transition = 'none';
          d.classList.remove('tl-desc-active');
          void d.offsetWidth;
          d.style.transition = '';
        });

        // Fade in clicked after a short pause
        item.classList.add('tl-active');
        var desc = document.querySelector('.svc-tl-desc[data-for="' + stage + '"]');
        if (desc) {
          setTimeout(function () {
            desc.classList.add('tl-desc-active');
          }, 80);
        }
      });
    });
  }

  /* Match each stage desc width to its title width */
  function syncDescWidths() {
    var stages = document.querySelectorAll('.svc-scene-stage');
    stages.forEach(function (scene) {
      var name = scene.querySelector('.svc-stage-name');
      var desc = scene.querySelector('.svc-stage-desc');
      if (name && desc) {
        desc.style.maxWidth = name.offsetWidth + 'px';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); initBirdseye(); syncDescWidths(); });
  } else {
    init();
    initBirdseye();
    syncDescWidths();
  }
  window.addEventListener('resize', syncDescWidths);
})();
