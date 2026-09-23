/* YT Turbo - page world: removes the View Transitions overhead.
   YouTube sets view-transition-name on #below and #secondary, so every
   layout change (fullscreen, theater mode, navigation) snapshots those
   subtrees. Here the callback runs at once, with no snapshots and no animation. */
(() => {
  'use strict';
  if (typeof document.startViewTransition !== 'function') return;

  const original = document.startViewTransition.bind(document);
  let patched = false;

  const instant = function (arg) {
    const cb = typeof arg === 'function' ? arg : (arg && arg.update);
    let done;
    try {
      const r = cb && cb();
      done = r && typeof r.then === 'function' ? r : Promise.resolve();
    } catch (e) {
      done = Promise.reject(e);
    }
    done.catch(() => {});
    const settled = done.catch(() => {});
    return {
      ready: settled,
      finished: settled,
      updateCallbackDone: done,
      types: (arg && arg.types) || null,
      skipTransition() {}
    };
  };

  function apply(on) {
    if (on === patched) return;
    document.startViewTransition = on ? instant : original;
    patched = on;
  }

  apply(true); // off by default, content.js corrects it from the saved settings

  window.addEventListener('ytturbo-vt', e => {
    apply(!!(e && e.detail && e.detail.on));
  }, true);
})();
