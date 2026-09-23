/* YT Turbo - local (not network) speedups for the YouTube interface */
(() => {
  'use strict';

  const DEFAULTS = {
    noAnim: true,          // every transition and animation cut to 1ms
    hardAnim: false,       // hard: transition/animation: none
    keepSpinner: true,     // keep loading spinners running
    noRipple: true,        // no click ripples, no hover highlights
    noAmbient: true,       // no ambient mode (the glow around the player)
    noViewTransitions: true, // no View Transitions (page snapshots on every layout change)
    fastFullscreen: true,  // instant relayout when entering fullscreen
    instantPause: true,    // a click pauses at once, without waiting for a double click
    warmSettings: true,    // prewarm the player settings panel
    eagerComments: true,   // comments start loading at once, without scrolling
    offscreenSkip: true,   // do not render what is offscreen
    noHoverPreview: true,  // no hover previews, no animated thumbnails
    noBlur: true,          // no backdrop blur
    instantScroll: true    // instant scroll instead of smooth
  };

  const CSS = {
    noAnim: `
*, *::before, *::after {
  transition-duration: 1ms !important;
  transition-delay: 0s !important;
  animation-duration: 1ms !important;
  animation-delay: 0s !important;
}
.ytp-tooltip, .ytp-popup, .ytp-panel, .ytp-panel-menu, .ytp-settings-menu,
tp-yt-iron-dropdown, tp-yt-paper-dialog, ytd-popup-container, #movie_player,
.ytp-panel-animate-forward, .ytp-panel-animate-back,
ytd-engagement-panel-section-list-renderer, #expand, #collapse {
  transition: none !important;
}
`,
    hardAnim: `
*, *::before, *::after {
  transition: none !important;
  animation: none !important;
}
`,
    keepSpinner: `
.ytp-spinner, .ytp-spinner *, tp-yt-paper-spinner, tp-yt-paper-spinner *,
tp-yt-paper-spinner-lite, tp-yt-paper-spinner-lite *, #spinner, #spinner *,
.yt-spinner-circle, ytd-continuation-item-renderer * {
  animation-duration: 1.2s !important;
  animation-iteration-count: infinite !important;
}
`,
    noRipple: `
yt-touch-feedback-shape, .ytSpecTouchFeedbackShapeHost,
.ytSpecTouchFeedbackShapeFill, .ytSpecTouchFeedbackShapeStroke,
tp-yt-paper-ripple, paper-ripple, #ripple,
.yt-spec-touch-feedback-shape, .yt-spec-touch-feedback-shape__fill,
.yt-spec-touch-feedback-shape__stroke,
yt-light-shape, .contribYtLightShapeHost {
  display: none !important;
}
`,
    noAmbient: `
#cinematics, #cinematics-container, #cinematics-full-bleed-container,
.ytp-cinematics-container, #cinematics canvas,
ytd-watch-flexy[cinematics-enabled] #cinematics {
  display: none !important;
}
`,
    noViewTransitions: `
html, #below, #secondary, #primary, #player, #columns, ytd-watch-flexy, ytd-app {
  view-transition-name: none !important;
}
::view-transition-group(*), ::view-transition-image-pair(*),
::view-transition-old(*), ::view-transition-new(*) {
  animation: none !important;
  mix-blend-mode: normal !important;
}
`,
    fastFullscreen: `
ytd-app, ytd-watch-flexy, ytd-page-manager, #columns, #primary, #secondary,
#player, #player-container, #player-container-inner, #player-container-outer,
#movie_player, .html5-video-container, video.html5-main-video,
.ytp-chrome-bottom, .ytp-chrome-top {
  transition: none !important;
}
ytd-watch-flexy[fullscreen] #cinematics { display: none !important; }
ytd-watch-flexy[fullscreen] #below,
ytd-watch-flexy[fullscreen] #secondary { content-visibility: hidden !important; }
`,
    offscreenSkip: `
ytd-comment-thread-renderer, ytd-comment-view-model {
  content-visibility: auto !important;
  contain-intrinsic-size: auto 132px !important;
}
ytd-rich-item-renderer {
  content-visibility: auto !important;
  contain-intrinsic-size: auto 330px !important;
}
ytd-video-renderer, ytd-compact-video-renderer, ytd-playlist-video-renderer,
ytd-grid-video-renderer, ytd-reel-item-renderer, yt-lockup-view-model {
  content-visibility: auto !important;
  contain-intrinsic-size: auto 110px !important;
}
`,
    noHoverPreview: `
ytd-video-preview, #video-preview, ytd-moving-thumbnail-renderer,
ytd-thumbnail-overlay-loading-preview-renderer, ytd-inline-playback-renderer,
yt-animated-image, .ytd-animated-thumbnail-overlay,
ytd-thumbnail img.ytd-moving-thumbnail-renderer {
  display: none !important;
}
ytd-thumbnail:hover, ytd-rich-item-renderer:hover, yt-lockup-view-model:hover {
  transform: none !important;
}
`,
    noBlur: `
* { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
`,
    instantScroll: `
html, body, ytd-app, #contents, #primary, #columns, * { scroll-behavior: auto !important; }
`
  };

  let cfg = Object.assign({}, DEFAULTS);
  const style = document.createElement('style');
  style.id = 'yt-turbo-style';

  function buildCss() {
    const parts = [];
    if (cfg.hardAnim) {
      parts.push(CSS.hardAnim);
    } else if (cfg.noAnim) {
      parts.push(CSS.noAnim);
      if (cfg.keepSpinner) parts.push(CSS.keepSpinner);
    }
    ['noRipple', 'noAmbient', 'noViewTransitions', 'fastFullscreen', 'offscreenSkip',
     'noHoverPreview', 'noBlur', 'instantScroll']
      .forEach(k => { if (cfg[k]) parts.push(CSS[k]); });
    style.textContent = parts.join('\n');
  }

  function attach() {
    const root = document.documentElement;
    if (root && style.parentNode !== root) root.appendChild(style);
  }

  // apply before the first frame, then correct from the saved settings
  buildCss();
  attach();
  if (!document.documentElement) {
    new MutationObserver((_, o) => {
      if (document.documentElement) { attach(); o.disconnect(); }
    }).observe(document, { childList: true });
  }

  /* ---------- JS part ---------- */

  function killAmbient() {
    if (!cfg.noAmbient) return;
    document.querySelectorAll('#cinematics, .ytp-cinematics-container').forEach(el => el.remove());
    document.querySelectorAll('ytd-watch-flexy[cinematics-enabled]')
      .forEach(el => el.removeAttribute('cinematics-enabled'));
    try {
      localStorage.setItem('yt-player-cinematic-settings',
        JSON.stringify({ data: { cinematicSettingEnabled: false }, creation: Date.now() }));
    } catch (e) {}
  }

  function killHoverPreview() {
    if (!cfg.noHoverPreview) return;
    document.querySelectorAll('ytd-video-preview, #video-preview').forEach(el => el.remove());
  }

  function killViewTransitionAttrs() {
    if (!cfg.noViewTransitions) return;
    document.querySelectorAll('[view-transition-enabled]')
      .forEach(el => el.removeAttribute('view-transition-enabled'));
  }

  // Click on the video: YouTube waits for a possible double click before toggling pause.
  // Measured on a live page: 305 ms from the click to the pause event.
  // We catch the click in the capture phase and toggle it ourselves: 7-50 ms.
  // A real double click still goes to fullscreen (we never touch dblclick, and
  // our two toggles cancel out, leaving playback exactly as it was).
  const SKIP_CLICK = '.ytp-chrome-bottom, .ytp-chrome-top, .ytp-popup, .ytp-ce-element,' +
    '.ytp-cards-teaser, .ytp-settings-menu, .ytp-endscreen-content, .ytp-pause-overlay,' +
    '.ytp-player-content, a, button, [role="button"]';

  function onPlayerClick(e) {
    if (!cfg.instantPause || e.button !== 0) return;
    const player = document.getElementById('movie_player');
    if (!player || !player.contains(e.target)) return;
    if (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting')) return;
    if (e.target.closest && e.target.closest(SKIP_CLICK)) return;
    const v = player.querySelector('video.html5-main-video');
    if (!v || !v.src && !v.currentSrc) return;
    e.stopPropagation();
    if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    else { v.pause(); }
  }

  window.addEventListener('click', onPlayerClick, true);

  // Prewarming the settings panel: the first click on the gear builds it from scratch
  // (measured: 97 ms against 15 ms once built). We build it in advance, invisibly.
  // We read the panel state from its display value, not from aria-expanded:
  // YouTube only sets aria-expanded about 140-300 ms after the click,
  // so the old check at 150 ms was too early. The panel did not close,
  // the mask came off it, and the settings stayed visible on screen.
  let warmed = false;

  function menuIsOpen(menu) {
    return !!menu && getComputedStyle(menu).display !== 'none';
  }

  function warmSettings() {
    if (!cfg.warmSettings || warmed) return;
    const player = document.getElementById('movie_player');
    const btn = player && player.querySelector('.ytp-settings-button');
    const menu = player && player.querySelector('.ytp-settings-menu');
    if (!btn || !menu) return;
    if (menuIsOpen(menu)) return; // already open, so it is being built anyway, no prewarming needed
    warmed = true;

    const hide = document.createElement('style');
    hide.textContent = '.ytp-popup, .ytp-settings-menu, .ytp-tooltip {' +
      ' opacity: 0 !important; pointer-events: none !important; }';
    document.documentElement.appendChild(hide);

    let timer = 0;
    // Remove the mask synchronously with a timer as a backup: rAF does not fire
    // in a background tab, and that is where videos usually get opened.
    const failsafe = setTimeout(() => hide.remove(), 5000);
    const unmask = () => {
      if (timer) { clearInterval(timer); timer = 0; }
      clearTimeout(failsafe);
      btn.removeEventListener('pointerdown', onUserClick, true);
      hide.remove();
    };
    // if the user opened the settings during prewarming, get out of the way
    const onUserClick = e => { if (e.isTrusted) unmask(); };
    btn.addEventListener('pointerdown', onUserClick, true);

    try { btn.click(); } catch (e) { unmask(); return; }

    // Close the panel and remove the mask only after confirming it really closed,
    // instead of trusting a blind timer.
    // Time is measured on the clock, not by counting ticks: in a background tab
    // tab setInterval gets throttled to about once per second.
    const FIRST = 200, GAP = 300, LIMIT = 3000;
    const t0 = Date.now();
    let lastClick = -GAP, clicks = 0;
    timer = setInterval(() => {
      const elapsed = Date.now() - t0;
      if (!menuIsOpen(menu)) {
        if (clicks === 0) warmed = false; // the click did not open the panel, try again later
        unmask();
        return;
      }
      if (elapsed >= FIRST && elapsed - lastClick >= GAP && clicks < 5) {
        lastClick = elapsed;
        clicks++;
        try { btn.click(); } catch (e) {}
      }
      if (elapsed >= LIMIT) { menu.style.display = 'none'; unmask(); } // last resort
    }, 50);
  }

  // Comments: YouTube only loads them when the block enters the viewport.
  // We briefly place it as an invisible layer over the screen, without touching
  // the scroll position, so YouTube's own IntersectionObserver fires.
  const POKE_CSS = ';position:fixed!important;top:0!important;left:0!important;' +
    'width:100vw!important;height:100vh!important;margin:0!important;' +
    'opacity:0!important;pointer-events:none!important;z-index:-2147483647!important;';
  let pokedFor = '';
  function eagerComments(attempt) {
    if (!cfg.eagerComments) return;
    if (!location.pathname.startsWith('/watch')) return;
    const key = location.search;
    if (pokedFor === key) return;
    const c = document.getElementById('comments');
    if (!c || !c.querySelector('ytd-continuation-item-renderer')) return;
    if (document.querySelector('ytd-comment-thread-renderer')) { pokedFor = key; return; }
    pokedFor = key;
    const prev = c.getAttribute('style') || '';
    c.setAttribute('style', prev + POKE_CSS);
    setTimeout(() => {
      if (prev) { c.setAttribute('style', prev); } else { c.removeAttribute('style'); }
      // one retry in case YouTube was not ready
      if (!document.querySelector('ytd-comment-thread-renderer') && !(attempt > 0)) {
        pokedFor = '';
        setTimeout(() => eagerComments(1), 600);
      }
    }, 1500);
  }

  function tick() {
    killAmbient();
    killHoverPreview();
    killViewTransitionAttrs();
    warmSettings();
    eagerComments(0);
  }

  function runCycle() {
    // we do not reset warmed: the player and its menu survive SPA navigation,
    // so the prewarmed panel stays built until the page reloads
    [0, 400, 1000, 2000, 3500].forEach(t => setTimeout(tick, t));
  }

  document.addEventListener('yt-navigate-finish', runCycle, true);
  document.addEventListener('yt-page-data-updated', tick, true);
  document.addEventListener('fullscreenchange', () => setTimeout(killAmbient, 0), true);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runCycle, { once: true });
  } else {
    runCycle();
  }
  window.addEventListener('load', runCycle, { once: true });

  /* ---------- settings ---------- */

  function pushToMainWorld() {
    try {
      window.dispatchEvent(new CustomEvent('ytturbo-vt', { detail: { on: !!cfg.noViewTransitions } }));
    } catch (e) {}
  }

  try {
    chrome.storage.local.get(DEFAULTS, saved => {
      cfg = Object.assign({}, DEFAULTS, saved || {});
      buildCss();
      attach();
      pushToMainWorld();
      runCycle();
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      Object.keys(changes).forEach(k => { cfg[k] = changes[k].newValue; });
      buildCss();
      attach();
      pushToMainWorld();
    });
  } catch (e) {}
})();
