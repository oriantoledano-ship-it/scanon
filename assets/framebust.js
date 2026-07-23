/* ==========================================================================
   ScanOn — clickjacking protection.
   CSP's `frame-ancestors` is ignored when delivered via <meta>, and GitHub
   Pages can't set HTTP headers, so this is the enforcement layer.
   Loaded early (in <head>) so it runs before the page paints.
   ========================================================================== */
(function () {
  'use strict';

  // Not framed — the normal case. Do nothing at all.
  if (window.self === window.top) return;

  try {
    // Framed: try to break out. Cross-origin navigation of top is usually
    // permitted even when *reading* top's location is not.
    window.top.location = window.self.location.href;
  } catch (e) {
    // Blocked (e.g. a sandboxed iframe without allow-top-navigation).
    // Can't escape, so refuse to render usable content inside the frame.
    var show = function () {
      var el = document.createElement('div');
      el.setAttribute('dir', 'rtl');
      el.style.cssText = 'position:fixed;inset:0;z-index:2147483647;background:#022658;' +
        'color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;' +
        'padding:24px;font-family:system-ui,sans-serif;line-height:1.6';
      var inner = document.createElement('div');
      var p = document.createElement('p');
      p.style.cssText = 'font-size:18px;font-weight:700;margin:0 0 12px';
      p.textContent = 'העמוד מוצג בתוך אתר לא מורשה.';
      var a = document.createElement('a');
      a.href = 'https://oriantoledano-ship-it.github.io/scanon/';
      a.target = '_top';
      a.rel = 'noopener';
      a.style.cssText = 'color:#FBBF24;font-weight:700';
      a.textContent = 'מעבר לאתר הרשמי של ScanOn';
      inner.appendChild(p);
      inner.appendChild(a);
      el.appendChild(inner);
      document.body.appendChild(el);
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', show);
    } else {
      show();
    }
  }
})();
