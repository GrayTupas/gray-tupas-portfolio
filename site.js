// Intro: a small workflow runs node by node and ends on the portrait node, which then moves into its place in the hero.
// Runs once per tab session, never with reduced motion (the <head> script decides by adding html.intro).
(function () {
  var root = document.documentElement, me = document.getElementById('me');
  if (!root.classList.contains('intro') || !me) { root.classList.remove('intro'); return; }
  var layer = document.createElement('div');
  layer.className = 'intro-layer';
  layer.innerHTML =
    '<div class="intro-flow" aria-hidden="true">' +
      '<div class="node i-node"><header><span>Trigger</span><em>done</em></header><b>You opened the portfolio</b></div><i class="i-link"></i>' +
      '<div class="node i-node"><header><span>Step</span><em>done</em></header><b>Map the process</b></div><i class="i-link"></i>' +
      '<div class="node i-node"><header><span>Step</span><em>done</em></header><b>Build and test it</b></div><i class="i-link"></i>' +
      '<div class="node i-node"><header><span>Gate</span><em>done</em></header><b>A human approves</b></div><i class="i-link"></i>' +
      '<figure class="node i-node i-me"><header><span>gray-jan.tupas</span><em>done</em></header><img src="img/gray-jan-tupas.webp" width="640" height="871" alt=""></figure>' +
    '</div>' +
    '<button class="intro-skip" type="button">Skip intro</button>';
  document.body.prepend(layer);

  var t = 250, timers = [];
  layer.querySelectorAll('.i-node, .i-link').forEach(function (el) {
    timers.push(setTimeout(function () { el.classList.add('on'); }, t));
    t += el.classList.contains('i-link') ? 200 : 300;
  });

  var done = false;
  function finish(move) {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    try { sessionStorage.setItem('gt-intro', '1'); } catch (e) {}
    var pic = layer.querySelector('.i-me'), a = pic.getBoundingClientRect(), b = me.getBoundingClientRect();
    // only glide when the hero photo is on screen (on phones it sits below the fold)
    move = move && b.top < innerHeight && b.bottom > 0;
    if (move) {
      root.classList.add('intro-moving', 'from-intro');
      pic.style.transform = 'translate(' + (b.left - a.left) + 'px,' + (b.top - a.top) + 'px) scale(' + (b.width / a.width) + ')';
    }
    layer.classList.add('leaving');
    root.classList.remove('intro');
    setTimeout(function () { layer.remove(); root.classList.remove('intro-moving'); }, move ? 850 : 450);
  }
  layer.querySelector('.intro-skip').addEventListener('click', function () { finish(false); });
  setTimeout(function () { finish(true); }, t + 350);
})();

// Draws the connector wires between nodes, n8n style, from the real layout.
// Each [data-wires] container lists "from>to" pairs of element ids; its <svg class="wires"> gets one curve per pair.
(function () {
  var wide = window.matchMedia('(min-width: 860px)');

  function draw(box) {
    var svg = box.querySelector('svg.wires');
    if (!wide.matches) { svg.innerHTML = ''; return; } // stacked layout on phones: no wires
    var b = box.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
    svg.innerHTML = box.dataset.wires.split(',').map(function (pair) {
      var ids = pair.split('>'), a = document.getElementById(ids[0]), c = document.getElementById(ids[1]);
      if (!a || !c) return '';
      var A = a.getBoundingClientRect(), C = c.getBoundingClientRect();
      var x1 = A.right - b.left, y1 = A.top + A.height / 2 - b.top;
      var x2 = C.left - b.left, y2 = C.top + C.height / 2 - b.top;
      var dx = Math.max(24, (x2 - x1) / 2);
      return '<path d="M' + x1 + ' ' + y1 + 'C' + (x1 + dx) + ' ' + y1 + ' ' + (x2 - dx) + ' ' + y2 + ' ' + x2 + ' ' + y2 + '"/>' +
             '<circle cx="' + x2 + '" cy="' + y2 + '" r="3.5"/>';
    }).join('');
  }

  document.querySelectorAll('[data-wires]').forEach(function (box) {
    if ('ResizeObserver' in window) new ResizeObserver(function () { draw(box); }).observe(box);
    window.addEventListener('load', function () { draw(box); });
    wide.addEventListener('change', function () { draw(box); });
    draw(box);
  });
})();

// Marks the nav link of the section in the middle of the screen.
(function () {
  var links = document.querySelectorAll('.nav nav a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (a) { a.classList.remove('active'); a.removeAttribute('aria-current'); });
      var a = byId[e.target.id];
      if (a) { a.classList.add('active'); a.setAttribute('aria-current', 'true'); }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(byId).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
})();
