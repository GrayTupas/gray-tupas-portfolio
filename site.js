// Intro: a workflow runs like an n8n execution. One node pops up mid-screen, pulses while it runs and turns done;
// a packet travels down its wire, the next node pops up on the right and the "camera" (the track) slides to it.
// It ends on the portrait node, which then moves into its place in the hero.
// Runs once per tab session, never with reduced motion (the <head> script decides by adding html.intro).
(function () {
  var root = document.documentElement, me = document.getElementById('me');
  if (!root.classList.contains('intro') || !me) { root.classList.remove('intro'); return; }
  var STEPS = [['Trigger', 'You opened the portfolio'], ['Step', 'Map the process'], ['Step', 'Build and test it'], ['Gate', 'A human approves']];
  var html = '';
  STEPS.forEach(function (s) {
    html += '<div class="node i-node"><header><span>' + s[0] + '</span><em></em></header><b>' + s[1] + '</b></div>' +
            '<i class="i-link"><span>1 item</span></i>';
  });
  html += '<figure class="node i-node i-me"><header><span>gray-jan.tupas</span><em></em></header><img src="img/gray-jan-tupas.webp" width="640" height="871" alt=""></figure>';
  var layer = document.createElement('div');
  layer.className = 'intro-layer';
  layer.innerHTML = '<div class="i-progress" aria-hidden="true"></div><div class="intro-flow" aria-hidden="true">' + html + '</div>' +
    '<ol class="i-log" aria-hidden="true"></ol><button class="intro-skip" type="button">Skip intro</button>';
  document.body.prepend(layer);

  var flow = layer.querySelector('.intro-flow'), nodes = flow.querySelectorAll('.i-node'), links = flow.querySelectorAll('.i-link');
  var bar = layer.querySelector('.i-progress'), log = layer.querySelector('.i-log');
  var names = STEPS.map(function (s) { return s[1]; }).concat('gray-jan.tupas');
  var timers = [], at = function (ms, fn) { timers.push(setTimeout(fn, ms)); };
  function camera(node, instant) {
    flow.classList.toggle('no-anim', !!instant);
    flow.style.setProperty('--x', (innerWidth / 2 - (node.offsetLeft + node.offsetWidth / 2)) + 'px');
  }
  function line(text, done) {
    var li = document.createElement('li');
    li.textContent = text;
    if (done) li.className = 'ok';
    log.appendChild(li);
    while (log.children.length > 4) log.removeChild(log.firstChild);
  }
  function run(i) { nodes[i].classList.add('run'); nodes[i].querySelector('em').textContent = 'running'; }
  function ok(i) {
    nodes[i].classList.remove('run'); nodes[i].classList.add('on');
    nodes[i].querySelector('em').textContent = 'done';
    bar.style.transform = 'scaleX(' + (i + 1) / nodes.length + ')';
    line(names[i], true);
  }

  camera(nodes[0], true);
  at(100, function () { line('> execution started'); });
  at(150, function () { nodes[0].classList.add('show'); });
  at(350, function () { run(0); });
  at(700, function () { ok(0); });
  var T = 800, STEP = 900;
  for (var i = 1; i < nodes.length; i++) (function (i, t) {
    at(t, function () { links[i - 1].classList.add('on'); });   // the packet leaves the node that just ran
    at(t + 150, function () { nodes[i].classList.add('show'); }); // the next node pops up on the right
    at(t + 250, function () { camera(nodes[i]); });               // the camera moves on to it
    at(t + 500, function () { run(i); });                         // it runs
    at(t + 850, function () { ok(i); });                          // and finishes
  })(i, T + (i - 1) * STEP);
  var end = T + (nodes.length - 2) * STEP + 850 + 700;

  var finished = false;
  function finish(move) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    try { sessionStorage.setItem('gt-intro', '1'); } catch (e) {}
    var pic = layer.querySelector('.i-me'), r1 = pic.getBoundingClientRect(), r2 = me.getBoundingClientRect();
    // only glide when the hero photo is on screen (on phones it sits below the fold)
    move = move && r2.top < innerHeight && r2.bottom > 0;
    layer.classList.add('leaving');
    if (!move) layer.classList.add('fade');
    if (move) {
      root.classList.add('intro-moving', 'from-intro');
      pic.style.transform = 'translate(' + (r2.left - r1.left) + 'px,' + (r2.top - r1.top) + 'px) scale(' + (r2.width / r1.width) + ')';
    }
    root.classList.remove('intro');
    // once the photo has landed, the hero's wires draw and its three rule nodes pop in
    setTimeout(function () { layer.remove(); root.classList.remove('intro-moving'); if (move) root.classList.add('intro-landed'); }, move ? 850 : 450);
  }
  layer.querySelector('.intro-skip').addEventListener('click', function () { finish(false); });
  at(end, function () { finish(true); });
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
      return '<path' + (box.classList.contains('hero-flow') ? ' pathLength="1"' : '') + ' d="M' + x1 + ' ' + y1 + 'C' + (x1 + dx) + ' ' + y1 + ' ' + (x2 - dx) + ' ' + y2 + ' ' + x2 + ' ' + y2 + '"/>' +
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
