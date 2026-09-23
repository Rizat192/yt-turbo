const DEFAULTS = {
  noAnim: true,
  hardAnim: false,
  keepSpinner: true,
  noRipple: true,
  noAmbient: true,
  noViewTransitions: true,
  fastFullscreen: true,
  instantPause: true,
  warmSettings: true,
  eagerComments: true,
  offscreenSkip: true,
  noHoverPreview: true,
  noBlur: true,
  instantScroll: true
};

const keys = Object.keys(DEFAULTS);

function syncDisabled() {
  const hard = document.getElementById('hardAnim').checked;
  const anim = document.getElementById('noAnim').checked;
  const spin = document.getElementById('keepSpinner');
  spin.disabled = hard || !anim;
  document.getElementById('hardAnim').closest('label').style.opacity = anim ? 1 : 0.45;
  spin.closest('label').style.opacity = spin.disabled ? 0.45 : 1;
}

chrome.storage.local.get(DEFAULTS, saved => {
  const cfg = Object.assign({}, DEFAULTS, saved || {});
  keys.forEach(k => {
    const el = document.getElementById(k);
    if (!el) return;
    el.checked = !!cfg[k];
    el.addEventListener('change', () => {
      chrome.storage.local.set({ [k]: el.checked });
      syncDisabled();
    });
  });
  syncDisabled();
});

document.getElementById('reset').addEventListener('click', () => {
  chrome.storage.local.set(DEFAULTS, () => {
    keys.forEach(k => {
      const el = document.getElementById(k);
      if (el) el.checked = DEFAULTS[k];
    });
    syncDisabled();
  });
});

document.getElementById('reload').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (tabs && tabs[0]) chrome.tabs.reload(tabs[0].id);
    window.close();
  });
});
