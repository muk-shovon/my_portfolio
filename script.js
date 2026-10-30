/* =====================================================================
   Md. Muktaruzzaman Shovon — Portfolio interactions
   (ekfa-style: preloader, story reveal, service/experience tabs,
    portfolio wheel, FAQ accordion, counters, scroll motion)
   ===================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ===== Preloader: letters of SHOVON ===== */
  var preloader = $("#preloader");
  var plWord = $("#plWord");
  if (plWord) {
    "SHOVON".split("").forEach(function (ch, i) {
      var s = document.createElement("span");
      s.className = "pl-l";
      s.textContent = ch;
      s.style.animationDelay = (0.08 * i) + "s";
      plWord.appendChild(s);
    });
  }
  function hidePreloader() {
    if (!preloader || preloader.classList.contains("done")) return;
    preloader.classList.add("done");
    document.documentElement.classList.remove("is-loading");
  }
  if (reduced) { hidePreloader(); }
  else {
    window.addEventListener("load", function () { setTimeout(hidePreloader, 1500); });
    setTimeout(hidePreloader, 3200); /* failsafe */
  }
  if (preloader) preloader.addEventListener("click", hidePreloader);
  var plSkip = $("#plSkip");
  if (plSkip) plSkip.addEventListener("click", hidePreloader);

  /* ===== Falling snow ===== */
  var snow = $("#snow");
  if (snow && !reduced) {
    for (var i = 0; i < 26; i++) {
      var f = document.createElement("i");
      var size = 3 + Math.random() * 5;
      f.style.width = size + "px";
      f.style.height = size + "px";
      f.style.left = (Math.random() * 100) + "vw";
      f.style.opacity = (0.35 + Math.random() * 0.55).toFixed(2);
      f.style.animationDuration = (9 + Math.random() * 14).toFixed(1) + "s";
      f.style.animationDelay = (-Math.random() * 20).toFixed(1) + "s";
      snow.appendChild(f);
    }
  }

  /* ===== Scroll progress + nav state + scroll spy ===== */
  var prog = $("#scrollProg");
  var nav = $("#nav");
  var navInner = $("#navInner");
  var burger = $("#burger");
  var navLinks = $$("#navLinks a[href^='#']");

  function onScroll() {
    var st = window.scrollY || document.documentElement.scrollTop;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (prog) prog.style.transform = "scaleX(" + (h > 0 ? st / h : 0) + ")";
    if (nav) nav.classList.toggle("scrolled", st > 40);
    spy(st);
  }

  var sections = navLinks.map(function (a) { return document.getElementById(a.getAttribute("href").slice(1)); }).filter(Boolean);
  function spy(st) {
    var pos = st + window.innerHeight * 0.34;
    var currentId = null;
    sections.forEach(function (sec) {
      if (sec.offsetTop <= pos) currentId = sec.id;
    });
    navLinks.forEach(function (a) {
      a.classList.toggle("active", a.getAttribute("href") === "#" + currentId);
    });
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (burger && navInner) {
    burger.addEventListener("click", function () { navInner.classList.toggle("open"); });
  }
  navLinks.forEach(function (a) {
    a.addEventListener("click", function () { if (navInner) navInner.classList.remove("open"); });
  });

  /* ===== Reveal on scroll (blocks + eyebrow rules + split headings) ===== */
  function revealTarget(el) {
    el.classList.add(el.classList.contains("eyebrow") ? "eb-in" : "in");
  }
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { revealTarget(e.target); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

  $$(".reveal").forEach(function (el) { revealIO.observe(el); });
  $$(".eyebrow").forEach(function (el) { revealIO.observe(el); });

  /* split section headings into masked words */
  $$("[data-split]").forEach(function (h) {
    var words = h.textContent.trim().split(/\s+/);
    h.textContent = "";
    words.forEach(function (w, i) {
      var wm = document.createElement("span");
      wm.className = "wm";
      var wi = document.createElement("span");
      wi.className = "wi";
      wi.textContent = w;
      wi.style.transitionDelay = (i * 0.055) + "s";
      wm.appendChild(wi);
      h.appendChild(wm);
      if (i < words.length - 1) h.appendChild(document.createTextNode(" "));
    });
    revealIO.observe(h);
  });

  /* fallback: scroll-position reveal (guarantees content shows even if IO is delayed) */
  function visCheck() {
    var vh = window.innerHeight;
    $$(".reveal:not(.in), .eyebrow:not(.eb-in), [data-split]:not(.in), [data-count]").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh - 24) { /* in view, or already scrolled past */
        if (el.hasAttribute("data-count")) animateCount(el);
        else revealTarget(el);
      }
    });
  }
  window.addEventListener("scroll", visCheck, { passive: true });
  visCheck();
  /* safety net: if scroll events stall (fast jumps / background tabs), keep checking */
  setInterval(visCheck, 500);

  /* ===== Story: word-by-word scroll reveal ===== */
  var storyText = $("#storyText");
  var storyWords = [];
  if (storyText) {
    var accSet = { reliable: 1, admin: 1, networks: 1, tickets: 1, documented: 1, solved: 1 };
    var raw = storyText.textContent.trim().split(/\s+/);
    storyText.textContent = "";
    raw.forEach(function (w, i) {
      var s = document.createElement("span");
      s.className = "w";
      var clean = w.replace(/[^a-z]/gi, "").toLowerCase();
      if (accSet[clean]) s.classList.add("acc");
      s.textContent = w;
      storyText.appendChild(s);
      if (i < raw.length - 1) storyText.appendChild(document.createTextNode(" "));
      storyWords.push(s);
    });
  }
  function storyUpdate() {
    if (!storyText || !storyWords.length) return;
    var r = storyText.getBoundingClientRect();
    var vh = window.innerHeight;
    /* progress: 0 when top hits 80% of viewport, 1 when bottom hits 35% */
    var p = (vh * 0.82 - r.top) / (r.height + vh * 0.42);
    p = Math.max(0, Math.min(1, p));
    var n = Math.round(p * storyWords.length);
    for (var i = 0; i < storyWords.length; i++) {
      storyWords[i].classList.toggle("bright", i < n);
    }
  }
  window.addEventListener("scroll", storyUpdate, { passive: true });
  window.addEventListener("resize", storyUpdate);
  storyUpdate();

  /* ===== Counters ===== */
  function animateCount(el) {
    if (el._counted) return;
    el._counted = true;
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduced) { el.textContent = target + suffix; return; }
    var dur = 1600, t0 = performance.now();
    function step(t) {
      var k = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * e) + suffix;
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    /* fallback: rAF can stall (hidden tab / power saving) — lock in the final value */
    setTimeout(function () { el.textContent = target + suffix; }, dur + 350);
  }
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { animateCount(e.target); countIO.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  $$("[data-count]").forEach(function (el) { countIO.observe(el); });

  /* ===== Hero role ticker ===== */
  var roleWords = $$("#roleWords .hr-w");
  if (roleWords.length > 1 && !reduced) {
    var ri = 0;
    setInterval(function () {
      var cur = roleWords[ri];
      ri = (ri + 1) % roleWords.length;
      var nxt = roleWords[ri];
      cur.classList.remove("on"); cur.classList.add("out");
      nxt.classList.remove("out");
      /* force reflow so transition restarts from below */
      void nxt.offsetHeight;
      nxt.classList.add("on");
      setTimeout(function () { cur.classList.remove("out"); }, 550);
    }, 2600);
  }

  /* ===== Interactive tabs: services ===== */
  function bindTabs(root, itemSel, panelSel) {
    if (!root) return;
    var items = $$(itemSel, root);
    var panels = $$(panelSel, root);
    var preview = root.querySelector(".svc-preview, .xp-preview");
    function activate(idx) {
      items.forEach(function (it, i) {
        it.classList.toggle("active", i === idx);
        it.setAttribute("aria-selected", i === idx ? "true" : "false");
      });
      panels.forEach(function (p, i) { p.classList.toggle("active", i === idx); });
      if (preview && panels[idx]) {
        var c1 = panels[idx].style.getPropertyValue("--c1") || "#6FA3FF";
        preview.style.setProperty("--pc1", c1);
      }
    }
    items.forEach(function (it, i) {
      it.addEventListener("click", function () { activate(i); });
      it.addEventListener("mouseenter", function () {
        if (window.matchMedia("(hover:hover)").matches) activate(i);
      });
      it.addEventListener("keydown", function (ev) {
        var d = ev.key === "ArrowDown" || ev.key === "ArrowRight" ? 1 : (ev.key === "ArrowUp" || ev.key === "ArrowLeft" ? -1 : 0);
        if (!d) return;
        ev.preventDefault();
        var n = (i + d + items.length) % items.length;
        items[n].focus(); activate(n);
      });
    });
    activate(0);
  }
  bindTabs($("#svcInter"), ".svc-item", ".svc-preview-panel");
  bindTabs($("#xpInter"), ".xp-item", ".xp-preview-panel");

  /* ===== Portfolio wheel ===== */
  var stage = $("#pfStage");
  var cards = $$("#pfCards .pf-card");
  if (stage && cards.length) {
    var N = cards.length;
    var STEP = 360 / N;
    var rot = 0, target = 0, dragging = false, lastX = 0, vel = 0, raf = null, activeIdx = -1;

    var pfIndex = $("#pfIndex"), pfCount = $("#pfCount"), pfTitle = $("#pfTitle");
    var wdTitle = $("#wdTitle"), wdDesc = $("#wdDesc"), workDetail = $("#workDetail");

    function layout() {
      var cs = getComputedStyle(stage);
      var d = parseFloat(cs.getPropertyValue("--d")) || 460;
      cards.forEach(function (card, i) {
        card.style.transform =
          "translate(-50%,-50%) rotate(" + (rot + i * STEP) + "deg) translateY(" + (-d) + "px) rotate(" + (-(rot + i * STEP)) + "deg)";
      });
      /* active = card nearest the top */
      var idx = ((Math.round(-rot / STEP) % N) + N) % N;
      if (idx !== activeIdx) {
        activeIdx = idx;
        cards.forEach(function (c, i) {
          c.classList.toggle("is-active", i === idx);
          c.style.zIndex = i === idx ? 10 : 5;
          c.style.setProperty("--dim", i === idx ? 0 : Math.min(0.5, Math.abs(i - idx) * 0.14));
        });
        var card = cards[idx];
        var no = ("0" + (idx + 1)).slice(-2);
        var total = ("0" + N).slice(-2);
        if (pfIndex) pfIndex.textContent = no + " / " + total;
        if (pfCount) pfCount.textContent = no;
        if (pfTitle) pfTitle.textContent = card.getAttribute("data-title") || "";
        if (workDetail) {
          workDetail.classList.remove("open");
          setTimeout(function () {
            if (wdTitle) wdTitle.textContent = card.getAttribute("data-title") || "";
            if (wdDesc) wdDesc.textContent = card.getAttribute("data-desc") || "";
            workDetail.classList.add("open");
          }, 180);
        }
      }
    }

    function tick() {
      rot += (target - rot) * 0.12;
      if (Math.abs(target - rot) < 0.05) { rot = target; raf = null; layout(); return; }
      layout();
      raf = requestAnimationFrame(tick);
    }
    function animate() { if (!raf) raf = requestAnimationFrame(tick); }

    function snap() { target = Math.round(rot / STEP) * STEP; animate(); }
    function go(dir) { target = Math.round(target / STEP) * STEP + dir * STEP; animate(); }

    /* drag */
    stage.addEventListener("pointerdown", function (e) {
      dragging = true; lastX = e.clientX; vel = 0;
      stage.classList.add("is-drag");
      stage.setPointerCapture(e.pointerId);
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      target = rot;
    });
    stage.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dx = e.clientX - lastX; lastX = e.clientX;
      vel = dx;
      rot += dx * 0.28;
      layout();
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      stage.classList.remove("is-drag");
      target = rot + vel * 2.4;
      snap();
    }
    stage.addEventListener("pointerup", endDrag);
    stage.addEventListener("pointercancel", endDrag);
    stage.addEventListener("pointerleave", endDrag);

    /* click a card → bring to top + open detail */
    cards.forEach(function (card, i) {
      card.addEventListener("click", function () {
        var cur = ((Math.round(-rot / STEP) % N) + N) % N;
        var diff = i - cur;
        if (diff > N / 2) diff -= N;
        if (diff < -N / 2) diff += N;
        target = Math.round(target / STEP) * STEP + diff * STEP;
        animate();
      });
    });

    /* arrows + keyboard */
    var prev = $("#pfPrev"), next = $("#pfNext");
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });
    stage.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); go(1); }
    });

    window.addEventListener("resize", layout);
    layout();
  }

  /* ===== FAQ accordion ===== */
  $$(".fq-item").forEach(function (item) {
    var q = $(".fq-q", item);
    var a = $(".fq-a", item);
    if (!q || !a) return;
    function set(open) {
      item.classList.toggle("open", open);
      a.style.maxHeight = open ? a.scrollHeight + "px" : "0px";
    }
    if (item.classList.contains("open")) set(true);
    q.addEventListener("click", function () {
      var willOpen = !item.classList.contains("open");
      $$(".fq-item").forEach(function (other) {
        if (other !== item) {
          other.classList.remove("open");
          var oa = $(".fq-a", other);
          if (oa) oa.style.maxHeight = "0px";
        }
      });
      set(willOpen);
    });
  });
  window.addEventListener("resize", function () {
    var open = $(".fq-item.open .fq-a");
    if (open) open.style.maxHeight = open.scrollHeight + "px";
  });

  /* ===== Copy email + toast ===== */
  var toast = $("#toast");
  var copyBtn = $("#copyMail");
  var EMAIL = "shovon@example.com";
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { toast.classList.remove("show"); }, 2400);
  }
  if (copyBtn) {
    function legacyCopy() {
      var ta = document.createElement("textarea");
      ta.value = EMAIL;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      showToast(ok ? "Email copied to clipboard" : EMAIL);
    }
    copyBtn.addEventListener("click", function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(EMAIL).then(
          function () { showToast("Email copied to clipboard"); },
          legacyCopy
        );
      } else {
        legacyCopy();
      }
    });
  }
})();