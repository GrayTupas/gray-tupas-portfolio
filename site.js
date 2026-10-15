(function () {
  /* ---- reveal: section fades and connector wires ---- */
  var reveals = document.querySelectorAll('.reveal, .wire');

  // Safety net: anything at or above the fold must never stay stuck invisible,
  // even if the observer never fires (background tab, blocked script, no IO).
  function sweep() {
    var pending = document.querySelectorAll('.reveal:not(.in), .wire:not(.in)');
    for (var i = 0; i < pending.length; i++) {
      if (pending[i].getBoundingClientRect().top < window.innerHeight + 80) {
        pending[i].classList.add('in');
      }
    }
  }
  window.addEventListener('load', sweep);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) sweep(); });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- expandable build nodes ---- */
  document.querySelectorAll('.build .disclose').forEach(function (btn, i) {
    var detail = btn.closest('.build').querySelector('.detail');
    detail.id = 'detail-' + (i + 1);
    btn.setAttribute('aria-controls', detail.id);
    btn.addEventListener('click', function () {
      var card = btn.closest('.build');
      var open = card.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.querySelector('span').textContent = open ? 'Hide detail' : 'View detail';
    });
  });

  /* ---- lightbox ---- */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = document.getElementById('lbImg');
    var lbCap = document.getElementById('lbCap');
    var lbClose = document.getElementById('lbClose');
    var lastFocus = null;

    var closeLb = function () {
      lb.hidden = true;
      lbImg.removeAttribute('src');
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };

    document.querySelectorAll('.shot-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        lastFocus = b;
        var img = b.querySelector('img');
        lbImg.src = b.dataset.src;
        lbImg.alt = img ? img.alt : '';
        lbCap.textContent = b.dataset.cap || '';
        lb.hidden = false;
        document.body.style.overflow = 'hidden';
        lbClose.focus();
      });
    });
    lbClose.addEventListener('click', closeLb);
    lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'DIV') closeLb(); });
    document.addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') closeLb();
      // the close button is the only control, so Tab stays on it
      if (e.key === 'Tab') { e.preventDefault(); lbClose.focus(); }
    });
  }

  /* ---- filters ---- */
  var chips = document.querySelectorAll('.chip-btn');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.dataset.filter;
      chips.forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      document.querySelectorAll('.build').forEach(function (card) {
        var show = f === 'all' || (card.dataset.cat || '').split(' ').indexOf(f) !== -1;
        card.classList.toggle('hidden', !show);
      });
    });
  });

  /* ---- active nav ---- */
  var links = document.querySelectorAll('[data-nav]');
  var secs = [].map.call(links, function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);

  function sync() {
    var probe = window.scrollY + window.innerHeight * 0.28;
    var cur = null;
    secs.forEach(function (s) { if (s.offsetTop <= probe) cur = s; });
    links.forEach(function (a) {
      a.classList.toggle('active', !!cur && a.getAttribute('href') === '#' + cur.id);
    });
  }
  document.addEventListener('scroll', function () { sync(); sweep(); }, { passive: true });
  sync();
  sweep();
})();
