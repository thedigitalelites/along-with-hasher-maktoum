/* =====================================================================
   Along with Hasher Maktoum — shared site script (all pages)
   Theme · toast · smooth scroll · menu · page transitions · pricing/currency
   · tabs · FAQ · cursor · GSAP scroll animations. Every block is guarded, so
   it runs safely on pages that do not contain the matching markup.
   ===================================================================== */
(function(){
  'use strict';
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce  = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine    = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGsap = !!(window.gsap && window.ScrollTrigger);
  const page    = document.body.dataset.page || 'home';
  const header  = $('#header'), menu = $('#menu'), openBtn = $('#menuOpen'), closeBtn = $('#menuClose');
  const floatCta = $('#floatCta'), toastEl = $('#toast');

  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Theme toggle (saved choice; follows system until the user picks) ---- */
  (function(){
    const btn = $('#themeToggle'), root = document.documentElement; if (!btn) return;
    const label = () => btn.setAttribute('aria-label', root.dataset.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
    label();
    function apply(t, save){
      root.classList.add('theme-switching');
      root.setAttribute('data-theme', t); label();
      if (save) { try { localStorage.setItem('tbh-theme', t); } catch (e) {} }
      clearTimeout(apply.t); apply.t = setTimeout(() => root.classList.remove('theme-switching'), 350);
    }
    btn.addEventListener('click', () => apply(root.dataset.theme === 'light' ? 'dark' : 'light', true));
    const mq = matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener && mq.addEventListener('change', e => {
      let saved = null; try { saved = localStorage.getItem('tbh-theme'); } catch (err) {}
      if (!saved) apply(e.matches ? 'light' : 'dark', false);
    });
  })();

  /* ---- Toast ---- */
  let tt;
  function toast(msg){ if (!toastEl) return; toastEl.textContent = msg; toastEl.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('is-on'), 3200); }
  $$('[data-toast]').forEach(b => b.addEventListener('click', () => toast(b.dataset.toast)));

  /* ---- Smooth scroll (Lenis) ---- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    try {
      lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
      if (hasGsap) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
      else { const raf = t => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
    } catch (e) { lenis = null; }
  }
  function goTo(hash, immediate){
    let el = null; try { el = hash === '#home' ? document.body : $(hash); } catch (e) {}
    if (!el) return;
    const top = hash === '#home' ? 0 : el.getBoundingClientRect().top + scrollY - 70;
    if (lenis) { lenis.scrollTo(hash === '#home' ? 0 : el, { offset: hash === '#home' ? 0 : -70, duration: 1.4, immediate: !!immediate }); return; }
    scrollTo({ top, behavior: (reduce || immediate) ? 'auto' : 'smooth' });
  }

  /* ---- Links: same-page anchors scroll smoothly, other pages fade out/in ---- */
  const norm = p => p.replace(/index\.html$/, '').replace(/\/$/, '');
  const here = norm(location.pathname);
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]'); if (!a) return;
    if (a.target === '_blank' || a.hasAttribute('download') || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    let u; try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin !== location.origin) return;
    const wasOpen = menu && menu.classList.contains('is-open');
    if (norm(u.pathname) === here) {                       // same page
      if (!u.hash && a.getAttribute('href').charAt(0) !== '#') return;
      const h = u.hash || '#home'; if (h.length < 2) return;
      let ok = h === '#home'; try { ok = ok || !!$(h); } catch (err) {}
      if (!ok) return;
      e.preventDefault();
      if (wasOpen) closeMenu(false);
      setTimeout(() => goTo(h), wasOpen ? 420 : 0);
      return;
    }
    e.preventDefault();                                    // other page
    if (wasOpen) closeMenu(false);
    if (reduce) { location.href = a.href; return; }
    document.body.classList.add('is-leaving');
    setTimeout(() => { location.href = a.href; }, 340);
  });
  addEventListener('pageshow', e => { if (e.persisted) document.body.classList.remove('is-leaving'); });
  if (location.hash && location.hash.length > 1 && !$('[data-tabs]')) {
    const jump = () => goTo(location.hash, true);
    setTimeout(jump, 200); addEventListener('load', () => setTimeout(jump, 350));
  }

  /* ---- Menu popup ---- */
  function openMenu(){ document.body.classList.add('menu-open'); menu.classList.add('is-open'); openBtn.setAttribute('aria-expanded','true'); lenis && lenis.stop(); document.body.style.overflow = 'hidden'; setTimeout(() => closeBtn.focus(), 60); }
  function closeMenu(refocus = true){ document.body.classList.remove('menu-open'); menu.classList.remove('is-open'); openBtn.setAttribute('aria-expanded','false'); lenis && lenis.start(); document.body.style.overflow = ''; if (refocus) openBtn.focus(); }
  if (menu && openBtn && closeBtn) {
    openBtn.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', () => closeMenu());
    document.addEventListener('keydown', e => {
      if (!menu.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeMenu();
      if (e.key === 'Tab') { const f = $$('a,button', menu); const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    });
  }

  /* ---- Header scrim, floating CTA, active link ---- */
  const navLinks = $$('.nav__link[data-nav]');
  const spyIds = ['home','meet-hasher','destinations','packages','why'];
  const spy = page === 'home' ? spyIds.map(id => document.getElementById(id)).filter(Boolean) : [];
  const footerEl = $('#contact');
  const staticNav = { destination: 'destinations', book: 'book' }[page];
  navLinks.forEach(l => { if (staticNav && l.dataset.nav === staticNav) l.setAttribute('aria-current', 'page'); });
  function onScroll(y){
    if (header) header.classList.toggle('is-scrolled', y > 40);
    const vh = innerHeight;
    if (floatCta) {
      const nearEnd = footerEl ? footerEl.getBoundingClientRect().top < vh * .95 : false;
      floatCta.classList.toggle('is-visible', y > vh * .9 && !nearEnd && !(menu && menu.classList.contains('is-open')));
    }
    if (spy.length) {
      let cur = 'home';
      spy.forEach(s => { if (s.getBoundingClientRect().top < vh * .45) cur = s.id; });
      navLinks.forEach(l => { const on = l.dataset.nav === cur; l.classList.toggle('is-active', on); });
    }
  }
  if (lenis) lenis.on('scroll', ({ scroll }) => onScroll(scroll));
  addEventListener('scroll', () => onScroll(scrollY), { passive: true });
  onScroll(scrollY);

  /* ---- FAQ accordion ---- */
  $$('.faq__q').forEach(q => q.addEventListener('click', () => {
    const open = q.getAttribute('aria-expanded') === 'true';
    $$('.faq__q').forEach(o => o.setAttribute('aria-expanded','false'));
    q.setAttribute('aria-expanded', String(!open));
    setTimeout(() => hasGsap && ScrollTrigger.refresh(), 650);
  }));

  /* ---- Tabs (privacy / policy page) ---- */
  $$('[data-tabs]').forEach(root => {
    const tabs = $$('[role="tab"]', root), panels = $$('[role="tabpanel"]', root), ink = $('.tabs__ink', root);
    function place(){ const t = tabs.find(x => x.getAttribute('aria-selected') === 'true'); if (!t || !ink) return; ink.style.setProperty('--x', t.offsetLeft + 'px'); ink.style.setProperty('--w', t.offsetWidth + 'px'); }
    function select(i, focus, push){
      tabs.forEach((t, k) => { const on = k === i; t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; });
      panels.forEach((p, k) => { const on = k === i; p.hidden = !on; p.classList.remove('is-in'); if (on) { void p.offsetWidth; p.classList.add('is-in'); } });
      place(); if (focus) tabs[i].focus();
      if (push) { try { history.replaceState(null, '', '#' + tabs[i].dataset.slug); } catch (e) {} }
      hasGsap && setTimeout(() => ScrollTrigger.refresh(), 60);
    }
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i, false, true));
      t.addEventListener('keydown', e => {
        const n = tabs.length; let k = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (i - 1 + n) % n;
        else if (e.key === 'Home') k = 0; else if (e.key === 'End') k = n - 1;
        if (k !== null) { e.preventDefault(); select(k, true, true); }
      });
    });
    const fromHash = tabs.findIndex(t => '#' + t.dataset.slug === location.hash);
    select(fromHash > -1 ? fromHash : 0, false, false);
    addEventListener('resize', place);
    addEventListener('load', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
    addEventListener('hashchange', () => { const k = tabs.findIndex(t => '#' + t.dataset.slug === location.hash); if (k > -1) select(k, false, false); });
  });

  /* ---- Hero video (home) ---- */
  const vid = $('#heroVideo');
  if (vid) {
    const mobileMq = matchMedia('(max-width: 760px)');
    const setHeroVideo = () => {
      const m = mobileMq.matches, src = m ? vid.dataset.mobile : vid.dataset.desktop;
      if (vid.getAttribute('src') === src) return;
      vid.poster = m ? vid.dataset.posterMobile : vid.dataset.posterDesktop;
      vid.src = src;
      if (reduce) { vid.removeAttribute('autoplay'); vid.pause(); } else vid.play().catch(() => {});
    };
    vid.addEventListener('error', () => {
      if (vid.getAttribute('src') !== './hero-desktop.mp4') { vid.src = './hero-desktop.mp4'; vid.poster = './hero-poster.jpg'; if (!reduce) vid.play().catch(() => {}); }
    });
    setHeroVideo(); mobileMq.addEventListener('change', setHeroVideo);
  }

  /* =====================================================================
     PRICING + CURRENCY  — edit these values only
     ===================================================================== */
  // Group rates (AED) for a private group of 2–4 guests — from Hasher's price list.
  const GROUP_AED = { one: 3500, two: 6800, three: 9900 };
  // Solo-traveller rates (AED). Leave as null until Hasher confirms them;
  // the site then shows "To be confirmed". Example: { one: 2500, two: 4800, three: 6900 }
  const SOLO_AED  = { one: null, two: null, three: null };
  // Display currencies. AED→USD uses the fixed UAE peg (3.6725).
  // EUR/GBP are approximate (mid-market, Nov 2026) — update occasionally.
  const CURRENCIES = { USD: { rate: 1 / 3.6725 }, AED: { rate: 1 }, EUR: { rate: 0.86 / 3.6725 }, GBP: { rate: 0.74 / 3.6725 } };
  const DEFAULT_CURRENCY = 'USD';
  let currency = DEFAULT_CURRENCY;
  try { const c = localStorage.getItem('tbh-currency'); if (CURRENCIES[c]) currency = c; } catch (e) {}
  const priceListeners = [];
  function money(aed, div = 1){
    const v = Math.round(aed * CURRENCIES[currency].rate / div);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, currencyDisplay: currency === 'AED' ? 'code' : 'narrowSymbol', maximumFractionDigits: 0, minimumFractionDigits: 0 }).format(v).replace(/^AED\s?/, 'AED ');
  }
  function renderPrices(){
    $$('[data-money]').forEach(el => { el.textContent = money(+el.dataset.money, +(el.dataset.div || 1)); });
    $$('[data-solo-rate]').forEach(el => {
      const v = SOLO_AED[el.dataset.soloRate];
      el.classList.toggle('is-request', v == null);
      el.textContent = v == null ? 'To be confirmed' : money(v);
    });
    $$('[data-cur-note]').forEach(n => n.textContent = currency === 'AED' ? 'Prices in UAE dirhams (AED).' : 'Approximate conversion from AED.');
    $$('[data-cur-switch] button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cur === currency)));
    priceListeners.forEach(fn => fn());
  }
  $$('[data-cur-switch]').forEach(g => {
    Object.keys(CURRENCIES).forEach(code => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.cur = code; b.textContent = code;
      b.addEventListener('click', () => { currency = code; try { localStorage.setItem('tbh-currency', code); } catch (e) {} renderPrices(); });
      g.appendChild(b);
    });
  });
  renderPrices();
  window.TBH = { GROUP_AED, SOLO_AED, money, onPrices: fn => priceListeners.push(fn), toast, lenis };

  /* ---- Custom cursor (fine pointers, motion allowed) ---- */
  if (fine && !reduce) {
    const c = $('.cursor');
    if (c) {
      const label = $('span', c);
      let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
      addEventListener('mousemove', e => { x = e.clientX; y = e.clientY; c.classList.add('is-on'); }, { passive: true });
      document.addEventListener('mouseleave', () => c.classList.remove('is-on'));
      (function loop(){ cx += (x - cx) * .2; cy += (y - cy) * .2; c.style.transform = `translate3d(${cx}px,${cy}px,0)`; requestAnimationFrame(loop); })();
      document.addEventListener('mouseover', e => {
        const lab = e.target.closest('[data-cursor]'); const link = e.target.closest('a,button,label,input,[role="tab"]');
        if (lab) { label.textContent = lab.dataset.cursor; c.classList.add('is-label'); c.classList.remove('is-link'); }
        else { c.classList.remove('is-label'); c.classList.toggle('is-link', !!link); }
      });
    }
  }

  /* ---- Scroll-highlighted words ---- */
  $$('.hl').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    if (!hasGsap || reduce) $$('.w', el).forEach(w => w.classList.add('on'));
  });

  /* =====================================================================
     SCROLL ANIMATIONS (GSAP + ScrollTrigger)
     ===================================================================== */
  if (!hasGsap || reduce) return;
  document.documentElement.classList.add('anim');
  gsap.registerPlugin(ScrollTrigger);
  const ease = 'power4.out';
  const intro = $('[data-intro]');
  const media = $('.hero__media');

  // Intro: header fade-in, masked headline lines, media reveal
  const tl = gsap.timeline({ delay: .1 });
  tl.to('.header .nav', { opacity: 1, y: 0, duration: 1.1, ease });
  if (intro) {
    tl.fromTo('[data-intro] .line__in', { y: 0, yPercent: 105 }, { yPercent: 0, duration: 1.3, ease, stagger: .1 }, .1)
      .to('[data-intro] [data-fade]', { opacity: 1, y: 0, duration: 1.1, ease, stagger: .08 }, .5);
  }
  if (media) {
    tl.to('.hero__media', { clipPath: 'inset(0% 0 0 0 round 15px)', duration: 1.6, ease: 'expo.out' }, .6);
    // Hero media scales up to full-bleed on scroll
    gsap.fromTo('.hero__media', { scale: 1 }, {
      scale: () => document.documentElement.clientWidth / media.offsetWidth,
      ease: 'none', transformOrigin: '50% 0%',
      scrollTrigger: { trigger: '.hero__media', start: 'top 85%', end: 'top top', scrub: true, invalidateOnRefresh: true }
    });
  }

  // Section headings: masked line reveal
  gsap.utils.toArray('main section:not([data-intro]) .line').forEach(line => {
    gsap.fromTo(line.querySelector('.line__in'), { y: 0, yPercent: 105 }, { yPercent: 0, duration: 1.2, ease, scrollTrigger: { trigger: line, start: 'top 92%' } });
  });
  // Fade-up
  gsap.utils.toArray('[data-fade]').filter(el => !el.closest('[data-intro]')).forEach(el => {
    gsap.to(el, { opacity: 1, y: 0, duration: 1.1, ease, scrollTrigger: { trigger: el, start: 'top 92%' } });
  });
  // Scroll-controlled word highlight
  gsap.utils.toArray('.hl').forEach(el => {
    const words = $$('.w', el);
    ScrollTrigger.create({ trigger: el, start: 'top 85%', end: 'bottom 45%', scrub: true,
      onUpdate: self => { const n = Math.round(self.progress * words.length); words.forEach((w, i) => w.classList.toggle('on', i < n)); } });
  });
  // Image zoom 1.08 → 1 as cards enter
  gsap.utils.toArray('[data-zoom] > img').forEach(s => {
    gsap.fromTo(s, { scale: 1.08 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: s.closest('[data-zoom]'), start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // Parallax backgrounds
  gsap.utils.toArray('[data-parallax] > img, [data-parallax] > video').forEach(s => {
    gsap.fromTo(s, { yPercent: -6, scale: 1.12 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: s.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });
  // Closing card scales 0.95 → 1
  if ($('.final__card')) gsap.fromTo('.final__card', { scale: .95 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.final', start: 'top bottom', end: 'center center', scrub: true } });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
