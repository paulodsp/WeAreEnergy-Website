/* ==========================================================
   We Are Energy - wae.js
   Site-wide script. Load on every page before </body>.
   Handles: theme, hero, scroll progress, reveal, highlight,
            counters, data-fact hydration, nav close.
   Page-specific: calcs.js loaded additionally on calc pages.
   ========================================================== */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. THEME TOGGLE
     Reads localStorage, falls back to system preference.
     Applies data-theme to <html>, updates toggle button.
  ---------------------------------------------------------- */
  var root  = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    var btn = document.querySelector('[data-theme-toggle]');
    if (btn) {
      var next = theme === 'dark' ? 'light' : 'dark';
      btn.setAttribute('aria-label', 'Switch to ' + next + ' mode');
      btn.setAttribute('title',      'Switch to ' + next + ' mode');
      btn.innerHTML = theme === 'dark'
        ? '<span aria-hidden="true">☀️</span>'
        : '<span aria-hidden="true">🌙</span>';
    }
  }

  (function initTheme() {
    var saved = localStorage.getItem('wae-theme');
    applyTheme(saved || (media.matches ? 'dark' : 'light'));
  })();

  var themeBtn = document.querySelector('[data-theme-toggle]');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var current = root.getAttribute('data-theme') || 'light';
      var next    = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('wae-theme', next);
      applyTheme(next);
    });
  }

  media.addEventListener('change', function (e) {
    if (!localStorage.getItem('wae-theme')) applyTheme(e.matches ? 'dark' : 'light');
  });


  /* ----------------------------------------------------------
     2. FOOTER YEAR
  ---------------------------------------------------------- */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();


  /* ----------------------------------------------------------
     3. HERO IMAGE FADE-IN
  ---------------------------------------------------------- */
  var hero = document.querySelector('.hero-photo');
  if (hero) setTimeout(function () { hero.classList.add('loaded'); }, 80);


  /* ----------------------------------------------------------
     4. SCROLL PROGRESS BAR
  ---------------------------------------------------------- */
  var pb = document.getElementById('scrollProgress');
  if (pb) {
    window.addEventListener('scroll', function () {
      var h = document.body.scrollHeight - window.innerHeight;
      if (h > 0) pb.style.transform = 'scaleX(' + Math.min(window.scrollY / h, 1) + ')';
    }, { passive: true });
  }


  /* ----------------------------------------------------------
     5. REVEAL ON SCROLL  (.reveal → .visible)
  ---------------------------------------------------------- */
  var revealIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { revealIO.observe(el); });


  /* ----------------------------------------------------------
     6. TEXT HIGHLIGHT  (.highlight → .on, delayed)
  ---------------------------------------------------------- */
  var highlightIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        setTimeout(function () { e.target.classList.add('on'); }, 450);
        highlightIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.7 });
  document.querySelectorAll('.highlight').forEach(function (el) { highlightIO.observe(el); });


  /* ----------------------------------------------------------
     7. COUNTER ANIMATION
     Targets: .counter[data-to]
     Formats: comma, dec1, fix2, gbp, pct, etc.
     Animates on intersection.
  ---------------------------------------------------------- */
  function animateCounter(el) {
    var target  = parseFloat(el.getAttribute('data-to'));
    var fmt     = el.getAttribute('data-fmt');
    var isDecimal = (target % 1 !== 0) || fmt === 'dec1';
    if (isNaN(target)) return;

    var duration = 1800;
    var t0 = null;

    (function step(ts) {
      if (!t0) t0 = ts;
      var p    = Math.min((ts - t0) / duration, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      var val  = target * ease;

      if (fmt === 'comma' || fmt === 'comma_plus') {
        el.textContent = Math.round(val).toLocaleString('en-GB') + (fmt === 'comma_plus' ? '+' : '');
      } else if (isDecimal) {
        el.textContent = val.toFixed(1);
      } else {
        el.textContent = Math.round(val);
      }

      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        /* Settle on exact final value with formatting */
        if (fmt === 'comma' || fmt === 'comma_plus') {
          el.textContent = target.toLocaleString('en-GB') + (fmt === 'comma_plus' ? '+' : '');
        } else if (isDecimal) {
          el.textContent = target.toFixed(1);
        } else {
          el.textContent = target;
        }
        el.classList.add('counted');
      }
    })(performance.now());
  }

  var counterIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        animateCounter(e.target);
        counterIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.counter[data-to]').forEach(function (el) { counterIO.observe(el); });


  /* ----------------------------------------------------------
     8. OFGEM SINGLE SOURCE OF TRUTH HYDRATION
     Fetches data/ofgem.json once.
     Hydrates both static inline [data-fact] spans and
     animated counter targets (.counter[data-fact-to]).
  ---------------------------------------------------------- */
  function getValByPath(obj, path) {
    if (!obj || !path) return undefined;
    return path.split('.').reduce(function (o, key) {
      return (o && o[key] !== undefined) ? o[key] : undefined;
    }, obj);
  }

  function formatFactValue(val, fmt) {
    if (val === undefined || val === null) return '';
    if (fmt === 'gbp') return '£' + Math.round(val).toLocaleString('en-GB');
    if (fmt === 'pct') return val + '%';
    if (fmt === 'comma') return Number(val).toLocaleString('en-GB');
    if (fmt === 'comma_plus') return Number(val).toLocaleString('en-GB') + '+';
    if (fmt === 'mw') return val + 'MW';
    if (fmt === 'gw') return val + 'GW';
    if (fmt === 'gw_plus') return val + 'GW+';
    if (fmt === 'mtco2') return val + ' MtCO₂e';
    if (fmt === 'gbpm') return '£' + val + 'm';
    if (fmt === 'gbpbn') return '£' + val + 'bn';
    if (fmt === 'dec1') return Number(val).toFixed(1);
    if (fmt === 'm') return val + ' million';
    return val;
  }

  function hydrateFacts(data) {
    if (!data) return;
    window.WAE_FACTS = data;

    // 1. Hydrate Counter Target Attributes (data-fact-to)
    document.querySelectorAll('.counter[data-fact-to]').forEach(function (el) {
      var path = el.getAttribute('data-fact-to');
      var val  = getValByPath(data, path);
      if (val !== undefined) {
        el.setAttribute('data-to', val);
        if (!el.classList.contains('counted')) {
          var fmt = el.getAttribute('data-fmt');
          el.textContent = (fmt === 'comma' || fmt === 'comma_plus')
            ? Number(val).toLocaleString('en-GB') + (fmt === 'comma_plus' ? '+' : '')
            : val;
        }
      }
    });

    // 2. Hydrate Inline Prose Spans (data-fact)
    document.querySelectorAll('[data-fact]').forEach(function (el) {
      if (el.closest('.counter')) return; // Avoid clashing with counter parent
      var path = el.getAttribute('data-fact');
      var val  = getValByPath(data, path);
      if (val !== undefined) {
        var fmt = el.getAttribute('data-fmt');
        el.textContent = formatFactValue(val, fmt);
      }
    });
  }

  fetch('data/ofgem.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function (raw) { hydrateFacts(raw); })
    .catch(function (err) { console.warn('WAE Facts hydration fallback skipped:', err); });


  /* ----------------------------------------------------------
     9. BOOTSTRAP NAVBAR - close on internal link click
  ---------------------------------------------------------- */
  var navCollapse = document.querySelector('.navbar-collapse');
  if (navCollapse) {
    navCollapse.addEventListener('click', function () {
      this.classList.remove('show');
    });
  }


  /* ----------------------------------------------------------
     10. FORM VALIDATION (Bootstrap pattern)
  ---------------------------------------------------------- */
  var form = document.querySelector('.needs-validation');
  if (form) {
    form.addEventListener('submit', function (e) {
      if (!this.checkValidity()) { e.preventDefault(); e.stopPropagation(); }
      this.classList.add('was-validated');
    });
  }


  /* ----------------------------------------------------------
     11. GENERIC PAGE SHARE  (.page-share-btn)
  ---------------------------------------------------------- */
  var pageShareBtn = document.getElementById('page-share-btn');
  if (pageShareBtn) {
    pageShareBtn.addEventListener('click', function () {
      var msg = 'I just signed up to join We Are Energy Co-operative. It\u2019s amazing and I think you\u2019ll love it too. Find out more and register here to act on #climatechange now and join the green energy revolution.';
      if (navigator.share) {
        navigator.share({
          title: 'We Are Energy Co-operative',
          text: msg,
          url: 'https://WeAreEnergy.coop'
        });
      } else {
        navigator.clipboard.writeText('https://WeAreEnergy.coop');
        alert('Our Web Address has been copied to your clipboard. Your browser doesn\u2019t support the Web Share API.');
      }
    });
  }


  /* ----------------------------------------------------------
     12. STICKY CTA
  ---------------------------------------------------------- */
  var stickyCta = document.getElementById('stickyCta');
  if (stickyCta) {
    function updateStickyCta() {
      var show = window.scrollY > 320;
      stickyCta.classList.toggle('visible', show);
      stickyCta.classList.toggle('hidden', !show);
    }

    window.addEventListener('scroll', updateStickyCta, { passive: true });
    window.addEventListener('resize', updateStickyCta);
    window.addEventListener('load', updateStickyCta);
    updateStickyCta();
  }

})();