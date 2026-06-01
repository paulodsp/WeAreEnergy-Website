/* ==========================================================
   We Are Energy - wae.js
   Site-wide script. Load on every page before </body>.
   Handles: theme, hero, scroll progress, reveal, highlight,
            counters, data-field hydration, nav close.
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
     Options: data-fmt="comma"  → formats with toLocaleString
              data-field-to="saving10" → value overridden by
              ofgem.json after hydration (see section 8)
     Animates on first intersection. Handles decimals.
  ---------------------------------------------------------- */
  function animateCounter(el) {
    var target  = parseFloat(el.getAttribute('data-to'));
    var useComma = el.getAttribute('data-fmt') === 'comma';
    var isDecimal = (target % 1 !== 0);
    if (isNaN(target)) return;

    var duration = 1800;
    var t0 = null;

    (function step(ts) {
      if (!t0) t0 = ts;
      var p    = Math.min((ts - t0) / duration, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      var val  = target * ease;
      if (isDecimal) {
        el.textContent = val.toFixed(1);
      } else if (useComma) {
        el.textContent = Math.round(val).toLocaleString('en-GB');
      } else {
        el.textContent = Math.round(val);
      }
      if (p < 1) requestAnimationFrame(step);
      else {
        /* settle on exact final value */
        el.textContent = isDecimal ? target.toFixed(1)
                       : useComma  ? target.toLocaleString('en-GB')
                       : target;
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
     8. OFGEM DATA HYDRATION
     Fetches data/ofgem.json once.
     Populates every [data-field] element on the page.
     Overwrites data-to on counters with data-field-to attribute
     so animated counters reflect live data.

     Supported data-field values:
       period      → quarter label e.g. "Q2 2026"
       unit_rate   → unit rate in p/kWh e.g. "24.90"
       standing    → standing charge p/day e.g. "44.83"
       saving10    → 10-yr saving £ e.g. "8,300"
       saving25    → 25-yr saving £ e.g. "38,000"

     data-field-to maps a counter's data-to to a live figure:
       saving10 → page_stats.saving_10yr_gbp
       saving25 → page_stats.saving_25yr_gbp
  ---------------------------------------------------------- */
  var OFGEM_FALLBACK = {
    period:   'Q3 2026',
    unitRate:  26.11,
    standing:  57.19,
    saving10:  8300,
    saving25:  38000
  };

  function hydrateFields(d) {
    var map = {
      period:    d.period,
      unit_rate: d.unitRate.toFixed(2),
      standing:  d.standing.toFixed(2),
      saving10:  d.saving10.toLocaleString('en-GB'),
      saving25:  d.saving25.toLocaleString('en-GB')
    };
    /* populate [data-field] spans */
    document.querySelectorAll('[data-field]').forEach(function (el) {
      var key = el.getAttribute('data-field');
      if (map[key] !== undefined) el.textContent = map[key];
    });
    /* update data-to on counters that reference live figures */
    var fieldToMap = { saving10: d.saving10, saving25: d.saving25 };
    document.querySelectorAll('.counter[data-field-to]').forEach(function (el) {
      var key = el.getAttribute('data-field-to');
      if (fieldToMap[key] !== undefined) {
        el.setAttribute('data-to', fieldToMap[key]);
        /* update visible fallback text too */
        var useComma = el.getAttribute('data-fmt') === 'comma';
        el.textContent = useComma
          ? fieldToMap[key].toLocaleString('en-GB')
          : fieldToMap[key];
      }
    });
  }

  function normalise(raw) {
    /* accept both ofgem.json shapes */
    return {
      period:   raw.quarter || OFGEM_FALLBACK.period,
      unitRate: (raw.gb_average && raw.gb_average.unit_rate_p) || OFGEM_FALLBACK.unitRate,
      standing: (raw.gb_average && raw.gb_average.standing_charge_p_day) || OFGEM_FALLBACK.standing,
      saving10: (raw.page_stats && raw.page_stats.saving_10yr_gbp)  || OFGEM_FALLBACK.saving10,
      saving25: (raw.page_stats && raw.page_stats.saving_25yr_gbp)  || OFGEM_FALLBACK.saving25
    };
  }

  fetch('data/ofgem.json')
    .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function (raw) { hydrateFields(normalise(raw)); })
    .catch(function () { hydrateFields(OFGEM_FALLBACK); });


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
   Used on index and about pages.
   calcs.js handles #share-btn on calculator pages separately.
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
   Shows after a short scroll on pages that include #stickyCta.
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
