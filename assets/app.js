/* =========================================================================
   ScanOn — motion & interaction.  GSAP + ScrollTrigger + Lenis.
   ========================================================================= */
(function () {
  'use strict';

  /* ScanOn / Orian business number (international format, no "+" / no leading 0). */
  var WA = '972525372958';
  var TEL = '052-537-2958';

  var root = document.documentElement;
  root.classList.remove('no-js'); root.classList.add('js');

  var hasGSAP = !!(window.gsap && window.ScrollTrigger);
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  var A = 'scanon-a11y', a11y = {};
  try { a11y = JSON.parse(localStorage.getItem(A)) || {}; } catch (e) {}
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || a11y.motion === 'off';
  var fine = matchMedia('(pointer: fine)').matches;
  var lenis = null;

  /* ---------- WhatsApp wiring ---------- */
  function waLink(msg) {
    return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg || 'היי, אשמח לפרטים על כרטיס ScanOn 🙂');
  }
  function initWhatsApp() {
    document.querySelectorAll('[data-wa]').forEach(function (a) {
      a.setAttribute('href', waLink(a.dataset.waMsg));
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
    });
  }

  /* ---------- Order form → WhatsApp ---------- */
  function initOrderForm() {
    var form = document.getElementById('orderForm');
    if (!form) return;
    var note = document.getElementById('orderNote');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var f = form.elements, ok = true;
      ['name', 'biz', 'phone'].forEach(function (n) {
        var el = f[n], val = (el.value || '').trim();
        var bad = !val || (n === 'phone' && (val.replace(/\D/g, '').length < 9));
        el.classList.toggle('invalid', bad);
        if (bad) ok = false;
      });
      if (!ok) { note.textContent = 'נא למלא שם, שם עסק וטלפון תקין.'; note.style.color = '#dc2626'; return; }
      var msg = 'הזמנת כרטיס ScanOn 👋\n'
        + 'שם: ' + f.name.value.trim() + '\n'
        + 'עסק: ' + f.biz.value.trim() + '\n'
        + 'טלפון: ' + f.phone.value.trim()
        + (f.type.value.trim() ? '\nסוג עסק: ' + f.type.value.trim() : '');
      note.textContent = 'מעבירים אתכם לוואטסאפ…'; note.style.color = '';
      window.open(waLink(msg), '_blank', 'noopener');
      form.reset();
    });
  }

  /* ---------- Shop + cart ---------- */
  /* Payment is a fixed "יש חשבונית" page (required by the card processor); the monthly plan is set up later by phone. */
  var PAY_URL = 'https://yeshlee.co.il/payment/c46a4bd0-a171-4f5e-8a86-9e106b1b0dcf';
  var PLAN = '₪49.90';
  var PRODUCTS = {
    blue:  { name: 'כרטיס ScanOn · כחול', price: 200, img: 'assets/img/card-blue.png' },
    black: { name: 'כרטיס ScanOn · שחור', price: 200, img: 'assets/img/card-black.png' }
  };
  var CK = 'scanon-cart', MAXQ = 20;
  var BAG = '<path d="M6 7h12l-1 13H7L6 7z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M9 9V6a3 3 0 0 1 6 0v3" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>';
  function ils(n) { return '₪' + n.toLocaleString('he-IL'); }

  function initCart() {
    var nav = document.querySelector('.nav__in');
    if (!nav) return;
    var onIndex = !!document.getElementById('shop');
    var shopHref = onIndex ? '#shop' : 'index.html#shop';
    var cart = {};
    try { cart = JSON.parse(localStorage.getItem(CK)) || {}; } catch (e) {}
    Object.keys(cart).forEach(function (k) { if (!PRODUCTS[k] || !(cart[k] > 0)) delete cart[k]; });

    /* nav button */
    var btn = document.createElement('button');
    btn.className = 'nav__cart'; btn.type = 'button';
    btn.setAttribute('aria-controls', 'cart'); btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">' + BAG + '</svg><span class="nav__cart-n">0</span>';
    nav.insertBefore(btn, nav.querySelector('.nav__burger'));

    /* panel */
    var ov = document.createElement('div'); ov.className = 'cart-ov';
    var panel = document.createElement('aside');
    panel.className = 'cart'; panel.id = 'cart';
    panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'cartTitle'); panel.setAttribute('aria-hidden', 'true');
    panel.setAttribute('data-lenis-prevent', '');
    panel.innerHTML =
      '<div class="cart__head"><h2 id="cartTitle">העגלה שלכם <span data-cn></span></h2>' +
        '<button type="button" class="cart__x" aria-label="סגירת העגלה"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg></button></div>' +
      '<div class="cart__body"><ul class="cart__list"></ul>' +
        '<div class="cart__empty"><svg viewBox="0 0 24 24" width="54" height="54" aria-hidden="true">' + BAG + '</svg><b>העגלה עדיין ריקה</b>בחרו כרטיס והתחילו לאסוף ביקורות.<br><a class="btn btn--navy" href="' + shopHref + '" data-close>לבחירת כרטיס</a></div></div>' +
      '<div class="cart__foot">' +
        '<div class="cart__row"><span>סכום ביניים</span><b data-sub></b></div>' +
        '<div class="cart__plan"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '<span><b>+ ' + PLAN + ' לחודש</b> מנוי למערכת ScanOn. התשלום החודשי בהוראת קבע: ניצור איתכם קשר אחרי ההזמנה כדי להסדיר אותו.</span></div>' +
        '<div class="cart__row cart__row--total"><span>לתשלום עכשיו</span><b data-total></b></div>' +
        '<label class="cart__terms"><input type="checkbox" id="cartTerms"> <span>קראתי ואני מאשר/ת את <a href="terms.html" target="_blank" rel="noopener">התקנון</a></span></label>' +
        '<a class="btn btn--gold btn--lg btn--block cart__go is-off" href="' + PAY_URL + '" target="_blank" rel="noopener">להשלמת ההזמנה<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></a>' +
        '<p class="cart__secure"><svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2" fill="none"/><path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2" fill="none"/></svg>תשלום מאובטח דרך "יש חשבונית"</p>' +
      '</div>';
    document.body.appendChild(ov); document.body.appendChild(panel);

    var list = panel.querySelector('.cart__list');
    var terms = panel.querySelector('#cartTerms'), termsLbl = panel.querySelector('.cart__terms');
    var go = panel.querySelector('.cart__go');
    var mcta = document.querySelector('.mcta'), mctaT = mcta && mcta.querySelector('.mcta__t');
    var lastFocus = null;

    function count() { return Object.keys(cart).reduce(function (s, k) { return s + cart[k]; }, 0); }
    function total() { return Object.keys(cart).reduce(function (s, k) { return s + cart[k] * PRODUCTS[k].price; }, 0); }
    function save() { try { localStorage.setItem(CK, JSON.stringify(cart)); } catch (e) {} }

    function render() {
      var n = count(), t = total();
      btn.querySelector('.nav__cart-n').textContent = n;
      btn.classList.toggle('has-items', n > 0);
      btn.setAttribute('aria-label', n ? 'העגלה, ' + n + ' פריטים' : 'העגלה ריקה');
      panel.dataset.empty = n ? '0' : '1';
      panel.querySelector('[data-cn]').textContent = n ? '(' + n + ')' : '';
      panel.querySelector('[data-sub]').textContent = ils(t);
      panel.querySelector('[data-total]').textContent = ils(t);
      list.innerHTML = Object.keys(PRODUCTS).filter(function (k) { return cart[k]; }).map(function (k) {
        var p = PRODUCTS[k], q = cart[k];
        return '<li class="cart__item" data-k="' + k + '"><img src="' + p.img + '" alt="" width="64" height="68">' +
          '<div><b>' + p.name + '</b><small>' + ils(p.price) + ' ליחידה</small>' +
            '<div class="qty" role="group" aria-label="כמות"><button type="button" data-d="1" aria-label="הוספת יחידה"' + (q >= MAXQ ? ' disabled' : '') + '>+</button>' +
            '<span class="qty__n">' + q + '</span><button type="button" data-d="-1" aria-label="הפחתת יחידה"' + (q <= 1 ? ' disabled' : '') + '>−</button></div></div>' +
          '<div class="cart__side"><span class="cart__line">' + ils(p.price * q) + '</span><button type="button" class="cart__rm" data-rm>הסרה</button></div></li>';
      }).join('');
      if (mctaT) mctaT.textContent = n ? 'לעגלה · ' + n + ' פריטים · ' + ils(t) : 'לרכישת כרטיס · ₪200';
    }

    function open() {
      lastFocus = document.activeElement;
      ov.classList.add('is-open'); panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false'); btn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('cart-on'); document.body.style.overflow = 'hidden';
      if (lenis) lenis.stop();
      setTimeout(function () { panel.querySelector('.cart__x').focus(); }, 60);
    }
    function close() {
      if (!panel.classList.contains('is-open')) return;
      ov.classList.remove('is-open'); panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true'); btn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('cart-on'); document.body.style.overflow = '';
      if (lenis) lenis.start();
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    function add(k, q, from) {
      cart[k] = Math.min(MAXQ, (cart[k] || 0) + q); save(); render();
      var fly = from && !reduce && from.getBoundingClientRect();
      if (!fly || !fly.width) { open(); return; }
      var to = btn.getBoundingClientRect();
      var img = document.createElement('img');
      img.src = PRODUCTS[k].img; img.className = 'cart-fly'; img.alt = '';
      img.style.cssText = 'left:' + fly.left + 'px;top:' + fly.top + 'px;width:' + fly.width + 'px;height:' + fly.height + 'px';
      document.body.appendChild(img);
      var dx = to.left + to.width / 2 - (fly.left + fly.width / 2), dy = to.top + to.height / 2 - (fly.top + fly.height / 2);
      var anim = img.animate([
        { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
        { transform: 'translate(' + dx * 0.55 + 'px,' + (dy * 0.55 - 60) + 'px) scale(.5) rotate(-10deg)', opacity: 1, offset: 0.55 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.08) rotate(-20deg)', opacity: 0.4 }
      ], { duration: 720, easing: 'cubic-bezier(.5,0,.3,1)' });
      anim.onfinish = function () {
        img.remove();
        btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
        setTimeout(open, 260);
      };
    }

    /* product cards */
    document.querySelectorAll('.prod').forEach(function (card) {
      var n = card.querySelector('.qty__n'), minus = card.querySelector('[data-step="-1"]');
      var q = 1;
      function setQ(v) { q = Math.max(1, Math.min(MAXQ, v)); n.textContent = q; minus.disabled = q <= 1; }
      setQ(1);
      card.querySelectorAll('[data-step]').forEach(function (b) {
        b.addEventListener('click', function () { setQ(q + +b.dataset.step); });
      });
      var addBtn = card.querySelector('[data-add]'), label = addBtn.firstChild, orig = label.nodeValue, t;
      addBtn.addEventListener('click', function () {
        add(addBtn.dataset.add, q, card.querySelector('.prod__media img'));
        addBtn.classList.add('is-added'); label.nodeValue = 'נוסף לעגלה ✓ ';
        clearTimeout(t);
        t = setTimeout(function () { addBtn.classList.remove('is-added'); label.nodeValue = orig; setQ(1); }, 1800);
      });
    });

    /* panel events */
    list.addEventListener('click', function (e) {
      var li = e.target.closest('.cart__item'); if (!li) return;
      var k = li.dataset.k, d = e.target.closest('[data-d]');
      if (d) cart[k] = Math.max(1, Math.min(MAXQ, cart[k] + +d.dataset.d));
      else if (e.target.closest('[data-rm]')) delete cart[k];
      else return;
      save(); render();
    });
    btn.addEventListener('click', open);
    ov.addEventListener('click', close);
    panel.querySelector('.cart__x').addEventListener('click', close);
    panel.querySelector('[data-close]').addEventListener('click', close);
    terms.addEventListener('change', function () { go.classList.toggle('is-off', !terms.checked); termsLbl.classList.remove('is-err'); });
    go.addEventListener('click', function (e) {
      if (!count()) { e.preventDefault(); return; }
      if (!terms.checked) {
        e.preventDefault();
        termsLbl.classList.remove('is-err'); void termsLbl.offsetWidth; termsLbl.classList.add('is-err');
        terms.focus();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (!panel.classList.contains('is-open')) return;
      if (e.key === 'Escape') { close(); return; }
      if (e.key === 'Tab') {   // keep focus inside the dialog
        var f = panel.querySelectorAll('button:not([disabled]), a[href], input');
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    /* mobile bar opens the cart once something is in it */
    if (mcta) mcta.addEventListener('click', function (e) {
      if (count()) { e.preventDefault(); e.stopImmediatePropagation(); open(); }
    }, true);
    window.addEventListener('storage', function (e) {
      if (e.key !== CK) return;
      try { cart = JSON.parse(e.newValue) || {}; } catch (x) { cart = {}; }
      render();
    });
    if (location.hash === '#cart') open();
    render();
  }

  /* ---------- Lenis smooth scroll ---------- */
  function initLenis() {
    if (reduce || !window.Lenis) return;
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1, lerp: 0.1 });
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
    }
  }

  /* ---------- Nav ---------- */
  function initNav() {
    var nav = document.getElementById('nav');
    var burger = document.querySelector('.nav__burger');
    var drawer = document.getElementById('drawer');
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 12); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

    if (burger && drawer) {
      var setOpen = function (o) {
        drawer.classList.toggle('is-open', o);
        nav.classList.toggle('is-open', o);   // knocks nav contents out to white over the navy drawer
        burger.setAttribute('aria-expanded', o);
        drawer.setAttribute('aria-hidden', !o);
        document.body.style.overflow = o ? 'hidden' : '';
        if (lenis) o ? lenis.stop() : lenis.start();
      };
      burger.addEventListener('click', function () { setOpen(!drawer.classList.contains('is-open')); });
      drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    }
  }

  /* ---------- Anchor scroll with offset ---------- */
  function initAnchors() {
    var nav = document.getElementById('nav');
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var t = document.querySelector(id);
        if (!t) return;
        e.preventDefault();
        var off = (nav ? nav.offsetHeight : 70) + 10;
        if (lenis) lenis.scrollTo(t, { offset: -off });
        else window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - off, behavior: reduce ? 'auto' : 'smooth' });
      });
    });
  }

  /* ---------- Hero: 3D scroll rotation (setup) ---------- */
  function initHero() {
    // wrap each title line for a clip reveal
    document.querySelectorAll('.hero__title .ln').forEach(function (ln) {
      ln.innerHTML = '<span class="lnw" style="display:inline-block">' + ln.innerHTML + '</span>';
    });
    if (!hasGSAP || reduce) return;
    var card = document.getElementById('card3d');
    var stage = document.getElementById('heroStage');
    if (!card || !stage) return;
    gsap.set(card, { rotateX: 6, rotateY: -18 });
    gsap.to(card, {
      rotateY: 202, rotateX: -3, ease: 'none',
      scrollTrigger: { trigger: stage, start: 'top top', end: '+=120%', scrub: 0.6, pin: true, pinSpacing: true, anticipatePin: 1 }
    });
  }

  /* ---------- Hero entrance (called when loader finishes) ---------- */
  function revealHero() {
    var em = document.querySelector('.hero__title em');
    if (!hasGSAP || reduce || document.hidden) { if (em) em.classList.add('is-drawn'); return; }
    gsap.from('.hero__title .lnw', { yPercent: 115, duration: 1, ease: 'expo.out', stagger: 0.12 });
    gsap.from('.hero__stars, .hero__lede, .hero__cta, .hero__trust',
      { y: 24, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.12 });
    gsap.from('.hero__cardwrap', { y: 30, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.1 });
    if (em) setTimeout(function () { em.classList.add('is-drawn'); }, 720);
  }

  /* ---------- Loader (page-refresh intro) ---------- */
  function initLoader(done) {
    var el = document.getElementById('loader');
    if (!el) { done(); return; }
    var finished = false;
    var finish = function () {
      if (finished) return; finished = true;
      el.classList.add('is-done');
      done();
      setTimeout(function () { el.style.display = 'none'; }, 850);
    };
    // Never trap the page: skip instantly if hidden/reduced/no-GSAP, plus a safety timeout.
    if (reduce || document.hidden || !hasGSAP) { finish(); return; }
    var bar = el.querySelector('.loader__bar i');
    gsap.timeline({ onComplete: finish })
      .from('.loader__mark, .loader__name', { y: 16, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1 })
      .to(bar, { width: '100%', duration: 1.0, ease: 'power1.inOut' }, 0.1)
      .to('.loader__in', { opacity: 0, y: -10, duration: 0.3, ease: 'power2.in' }, '+=0.05');
    setTimeout(finish, 2600);
  }

  /* ---------- Scroll reveals + signature underline ---------- */
  function drawUnders(el) {
    el.querySelectorAll('.h2 .u').forEach(function (u) { setTimeout(function () { u.classList.add('is-drawn'); }, 260); });
  }
  function initReveals() {
    if (!hasGSAP || reduce) {
      document.querySelectorAll('.will-rise, .will-fade').forEach(function (el) { el.classList.add('is-in'); });
      document.querySelectorAll('.h2 .u, .hero__title em').forEach(function (u) { u.classList.add('is-drawn'); });
      return;
    }
    ScrollTrigger.batch('.will-rise, .will-fade', {
      start: 'top 86%',
      onEnter: function (els) { els.forEach(function (el, i) { setTimeout(function () { el.classList.add('is-in'); drawUnders(el); }, i * 70); }); },
      once: true
    });
  }

  /* ---------- "How it works" — draw rings + connector 1→2→3 ---------- */
  function initSteps() {
    var wrap = document.getElementById('steps');
    if (!wrap) return;
    var lineFill = wrap.querySelector('.steps__line i');
    var rings = wrap.querySelectorAll('.step__ring circle');
    var ics = wrap.querySelectorAll('.step__ic');
    var texts = wrap.querySelectorAll('.step h3, .step p');
    rings.forEach(function (c) {
      var len = (c.getTotalLength ? c.getTotalLength() : 245);
      c.style.strokeDasharray = len;
      c.style.strokeDashoffset = (reduce || !hasGSAP) ? 0 : len;
    });
    if (reduce || !hasGSAP) { if (lineFill) lineFill.style.transform = 'scaleX(1)'; wrap.classList.add('is-drawn'); return; }
    gsap.set(ics, { scale: 0.4, opacity: 0 });
    gsap.set(texts, { y: 16, opacity: 0 });
    ScrollTrigger.create({
      trigger: wrap, start: 'top 72%', once: true, onEnter: function () {
        gsap.timeline()
          .to(rings[0], { strokeDashoffset: 0, duration: 0.6, ease: 'power2.in' }, 0)
          .to(ics[0], { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' }, 0.15)
          .to([texts[0], texts[1]], { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.2)
          .to(lineFill, { scaleX: 0.5, duration: 0.6, ease: 'power2.in' }, 0.35)   // draw 1 → 2 (slow→fast)
          .to(rings[1], { strokeDashoffset: 0, duration: 0.6, ease: 'power2.in' }, 0.75)
          .to(ics[1], { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' }, 0.85)
          .to([texts[2], texts[3]], { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.9)
          .to(lineFill, { scaleX: 1, duration: 0.6, ease: 'power2.in' }, 1.05)      // draw 2 → 3
          .to(rings[2], { strokeDashoffset: 0, duration: 0.6, ease: 'power2.in' }, 1.45)
          .to(ics[2], { scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(2)' }, 1.55)
          .to([texts[4], texts[5]], { y: 0, opacity: 1, duration: 0.5, ease: 'power2.out' }, 1.6)
          .add(function () { wrap.classList.add('is-drawn'); });
      }
    });
  }

  /* ---------- Rise to #1 on Google ---------- */
  function initRankRise() {
    var wrap = document.getElementById('rankRise');
    if (!wrap) return;
    var rows = wrap.querySelectorAll('.rank__row');
    var you = wrap.querySelector('[data-you]');
    var rate = wrap.querySelector('[data-rate]'), rev = wrap.querySelector('[data-rev]');
    var star = you.querySelector('.gstars');
    function setFinal() {
      rows.forEach(function (r) { r.style.order = (r === you) ? '0' : '1'; });
      rate.textContent = '4.9'; rev.textContent = '247'; if (star) star.style.setProperty('--fill', '98%');
      wrap.classList.add('is-ranked');
    }
    if (reduce || !hasGSAP) { setFinal(); return; }
    ScrollTrigger.create({
      trigger: wrap, start: 'top 76%', once: true, onEnter: function () {
        var step = rows[1].offsetTop - rows[0].offsetTop;
        var others = [].filter.call(rows, function (r) { return r !== you; });
        var o = { ra: 3.8, rv: 11, fl: 76 };
        var tl = gsap.timeline();
        tl.to(you, { y: -3 * step, duration: 0.95, ease: 'power3.inOut' }, 0)
          .to(others, { y: step, duration: 0.95, ease: 'power3.inOut' }, 0)
          .to(o, { ra: 4.9, rv: 247, fl: 98, duration: 1.1, ease: 'power2.out', onUpdate: function () {
            rate.textContent = o.ra.toFixed(1); rev.textContent = Math.round(o.rv);
            if (star) star.style.setProperty('--fill', o.fl + '%');
          } }, 0.2)
          .add(function () { wrap.classList.add('is-ranked'); }, 0.55);
      }
    });
  }

  /* ---------- Parallax ---------- */
  function initParallax() {
    if (!hasGSAP || reduce) return;
    var bg = document.querySelector('.hero__bg');
    if (bg) gsap.to(bg, { yPercent: 16, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- Counters ---------- */
  function initCounters() {
    var nums = document.querySelectorAll('[data-count]');
    nums.forEach(function (el) {
      var end = parseFloat(el.dataset.count), suf = el.dataset.suffix || '';
      if (reduce || !hasGSAP) { el.textContent = end + suf; return; }
      var obj = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: 'top 90%', once: true,
        onEnter: function () {
          gsap.to(obj, { v: end, duration: 1.6, ease: 'power2.out',
            onUpdate: function () { el.textContent = Math.round(obj.v) + suf; } });
        }
      });
    });
  }

  /* ---------- Star bars (Google-style rating fill) ---------- */
  function initStars() {
    document.querySelectorAll('.gstars[data-fill]').forEach(function (el) {
      el.style.setProperty('--fill', el.dataset.fill + '%');
    });
  }

  /* ---------- FAQ: single-open accordion ---------- */
  function initFaq() {
    var items = document.querySelectorAll('.faq__item');
    items.forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (d.open) items.forEach(function (o) { if (o !== d) o.open = false; });
      });
    });
  }

  /* ---------- Magnetic buttons ---------- */
  function initMagnetic() {
    if (!fine || reduce) return;
    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.28;
        var y = (e.clientY - r.top - r.height / 2) * 0.4;
        el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------- Sticky mobile CTA ---------- */
  function initMcta() {
    var mcta = document.querySelector('.mcta');
    var hero = document.getElementById('hero');
    if (!mcta || !hero) return;
    var onScroll = function () {
      var show = window.scrollY > hero.offsetHeight * 0.6;
      mcta.classList.toggle('is-on', show);
      document.body.classList.toggle('mcta-on', show);
    };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Accessibility widget ---------- */
  function initA11y() {
    var btn = document.querySelector('.a11y-btn'), panel = document.getElementById('a11yPanel');
    function apply(s) {
      s.contrast === 'high' ? root.setAttribute('data-contrast', 'high') : root.removeAttribute('data-contrast');
      s.text === 'large' ? root.setAttribute('data-text', 'large') : root.removeAttribute('data-text');
      s.links === 'on' ? root.setAttribute('data-links', 'on') : root.removeAttribute('data-links');
      s.motion === 'off' ? root.setAttribute('data-motion', 'off') : root.removeAttribute('data-motion');
      document.querySelectorAll('.a11y-chip').forEach(function (c) {
        var on = (s[c.dataset.key] || defVal(c.dataset.key)) === c.dataset.val;
        c.setAttribute('aria-pressed', on);
      });
    }
    function defVal(k) { return k === 'motion' ? 'on' : (k === 'contrast' ? 'normal' : (k === 'text' ? 'normal' : 'off')); }
    apply(a11y);

    if (btn && panel) {
      btn.addEventListener('click', function () {
        var o = panel.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', o); panel.setAttribute('aria-hidden', !o);
      });
      document.addEventListener('click', function (e) {
        if (!panel.contains(e.target) && !btn.contains(e.target)) {
          panel.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); panel.setAttribute('aria-hidden', 'true');
        }
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('is-open')) { panel.classList.remove('is-open'); btn.focus(); } });
    }
    document.querySelectorAll('.a11y-chip').forEach(function (c) {
      c.addEventListener('click', function () {
        a11y[c.dataset.key] = c.dataset.val;
        try { localStorage.setItem(A, JSON.stringify(a11y)); } catch (e) {}
        apply(a11y);
        if (c.dataset.key === 'motion') location.reload();
      });
    });
    var r = document.querySelector('.a11y-reset');
    if (r) r.addEventListener('click', function () { a11y = {}; try { localStorage.setItem(A, '{}'); } catch (e) {} apply(a11y); location.reload(); });
  }

  /* ---------- Boot ---------- */
  function boot() {
    var y = document.querySelector('[data-year]'); if (y) y.textContent = new Date().getFullYear();
    initWhatsApp(); initOrderForm(); initStars(); initFaq(); initA11y();
    initLenis(); initNav(); initCart(); initAnchors(); initHero(); initReveals(); initSteps(); initCounters(); initRankRise(); initMagnetic(); initMcta(); initParallax();
    initLoader(revealHero);
    if (hasGSAP) window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();
})();
