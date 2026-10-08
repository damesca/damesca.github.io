/* ==========================================================================
   CV page behaviour.  Vanilla, no dependencies, loaded with `defer`.

   Everything here is a progressive enhancement: with JavaScript disabled the
   page is still fully readable, the sections still expand and collapse (they
   are native <details>), and the two buttons that would do nothing stay
   hidden, because they are marked `hidden` in the HTML and only revealed from
   here.

     1. theme switch        light -> dark -> auto, remembered in localStorage
     2. expand / collapse   all sections at once
     3. deep links          #anchor opens its section, scrolls, highlights
     4. printing            open everything, then restore
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var sections = Array.prototype.slice.call(
    document.querySelectorAll('#cv-full .cv-section')
  );
  var toggleAll = document.getElementById('expand-all');

  function prefersReducedMotion() {
    return !!(window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* --- 1. Theme switch ---------------------------------------------------- */
  var THEME_KEY = 'cv-theme';
  var THEME_LABEL = {
    light: 'Colour theme: light. Click for dark.',
    dark: 'Colour theme: dark. Click to follow the system.',
    auto: 'Colour theme: follows your system. Click for light.'
  };
  var NEXT_THEME = { auto: 'light', light: 'dark', dark: 'auto' };

  function readTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function writeTheme(state) {
    try {
      if (state === 'auto') { localStorage.removeItem(THEME_KEY); }
      else { localStorage.setItem(THEME_KEY, state); }
    } catch (e) { /* private mode or storage disabled: just don't persist */ }
  }

  (function initTheme() {
    var button = document.getElementById('theme-toggle');
    if (!button) { return; }

    var state = readTheme();
    if (state !== 'light' && state !== 'dark') { state = 'auto'; }

    function apply() {
      // No attribute => prefers-color-scheme decides, which is the default.
      if (state === 'auto') { root.removeAttribute('data-theme'); }
      else { root.setAttribute('data-theme', state); }
      button.setAttribute('data-state', state);
      button.setAttribute('aria-label', THEME_LABEL[state]);
      button.setAttribute('title', THEME_LABEL[state]);
    }

    apply();
    button.hidden = false;

    button.addEventListener('click', function () {
      state = NEXT_THEME[state];
      apply();
      writeTheme(state);
    });
  })();

  /* --- 2. Expand / collapse all ------------------------------------------ */
  function allOpen() {
    for (var i = 0; i < sections.length; i++) {
      if (!sections[i].open) { return false; }
    }
    return sections.length > 0;
  }

  function syncToggleAll() {
    if (!toggleAll) { return; }
    var open = allOpen();
    toggleAll.textContent = open ? 'Collapse all' : 'Expand all';
    toggleAll.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (toggleAll && sections.length) {
    toggleAll.hidden = false;
    syncToggleAll();

    toggleAll.addEventListener('click', function () {
      var open = !allOpen();
      sections.forEach(function (d) { d.open = open; });
      syncToggleAll();
    });

    // Keep the label honest when sections are opened one by one.
    sections.forEach(function (d) {
      d.addEventListener('toggle', syncToggleAll);
    });
  }

  /* --- 3. Deep links ------------------------------------------------------ */
  var FLASH_MS = 2000;
  var flashTimer = null;
  var flashed = null;

  function highlight(el) {
    if (flashTimer) { window.clearTimeout(flashTimer); }
    if (flashed) { flashed.classList.remove('is-target'); }
    flashed = el;
    // Restart the animation even if the same element is targeted twice.
    void el.offsetWidth;
    el.classList.add('is-target');
    flashTimer = window.setTimeout(function () {
      el.classList.remove('is-target');
      flashed = null;
      flashTimer = null;
    }, FLASH_MS);
  }

  function reveal(hash, smooth) {
    if (!hash || hash.length < 2) { return; }

    var id;
    try { id = decodeURIComponent(hash.slice(1)); } catch (e) { id = hash.slice(1); }
    var el = document.getElementById(id);
    if (!el) { return; }

    // Open the target itself if it is a section, plus any section wrapping it.
    var node = el;
    while (node && node !== document.body) {
      if (node.tagName === 'DETAILS' && !node.open) { node.open = true; }
      node = node.parentNode;
    }
    syncToggleAll();

    var isSection = el.tagName === 'DETAILS';
    el.scrollIntoView({
      behavior: (smooth && !prefersReducedMotion()) ? 'smooth' : 'auto',
      block: isSection ? 'start' : 'center'
    });

    if (!isSection) { highlight(el); }
  }

  // On load: honour a hash someone was sent.
  reveal(window.location.hash, false);

  window.addEventListener('hashchange', function () {
    reveal(window.location.hash, true);
  });

  // Clicking an in-page link (e.g. a featured card) when the hash is already
  // the current one fires no hashchange, so handle the click too.
  document.addEventListener('click', function (ev) {
    var link = ev.target.closest ? ev.target.closest('a[href^="#"]') : null;
    if (!link) { return; }
    var hash = link.getAttribute('href');
    if (!hash || hash === '#') { return; }
    if (hash === window.location.hash) {
      ev.preventDefault();
      reveal(hash, true);
    }
  });

  /* --- 4. Printing -------------------------------------------------------- */
  var savedState = null;

  function openForPrint() {
    if (savedState) { return; }
    savedState = sections.map(function (d) { return d.open; });
    sections.forEach(function (d) { d.open = true; });
  }

  function restoreAfterPrint() {
    if (!savedState) { return; }
    sections.forEach(function (d, i) { d.open = savedState[i]; });
    savedState = null;
    syncToggleAll();
  }

  window.addEventListener('beforeprint', openForPrint);
  window.addEventListener('afterprint', restoreAfterPrint);

  // Safari fires no beforeprint/afterprint; this covers it.
  if (window.matchMedia) {
    var printQuery = window.matchMedia('print');
    var onPrintChange = function (mql) {
      if (mql.matches) { openForPrint(); } else { restoreAfterPrint(); }
    };
    if (printQuery.addEventListener) { printQuery.addEventListener('change', onPrintChange); }
    else if (printQuery.addListener) { printQuery.addListener(onPrintChange); }
  }
})();
