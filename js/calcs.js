/* ==========================================================
   We Are Energy - calcs.js
   Calculator script. Load on pages with id="calc-slider".
   Depends on wae.js already loaded (data hydration done).
   ========================================================== */

(function () {
  'use strict';

  var FALLBACK = {
    unitRate:  24.90,
    standing:  44.83,
    period:    'Q2 2026',
    saving10:  8300,
    saving25:  38000,
    baseline:  2855
  };

  fetch('data/ofgem.json')
    .then(function (r) { if (!r.ok) throw new Error(); return r.json(); })
    .then(function (raw) {
      init({
        unitRate: raw.gb_average.unit_rate_p,
        standing: raw.gb_average.standing_charge_p_day,
        period:   raw.quarter,
        saving10: raw.page_stats.saving_10yr_gbp,
        saving25: raw.page_stats.saving_25yr_gbp,
        baseline: 2855
      });
    })
    .catch(function () { init(FALLBACK); });

  function el(id)     { return document.getElementById(id); }
  function gbp(n)     { return '\u00a3' + Math.round(n).toLocaleString('en-GB'); }

  function set(id, val, raw) {
    var e = el(id);
    if (e) { e.textContent = val; e.dataset.current = (raw !== undefined ? raw : val); }
  }

  function animateTo(id, target, ms) {
    var e = el(id); if (!e) return;
    var start = parseFloat(e.dataset.current || '0', 10);
    var t0 = null;
    (function step(ts) {
      if (!t0) t0 = ts;
      var p    = Math.min((ts - t0) / ms, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      e.textContent = gbp(Math.round(start + (target - start) * ease));
      if (p < 1) requestAnimationFrame(step);
      else e.dataset.current = target;
    })(performance.now());
  }

  function init(d) {
    var slider  = el('calc-slider');
    var presets = document.querySelectorAll('.calc-preset');
    if (!slider) return;

    function bill(kwh)      { return (kwh * d.unitRate / 100) + (d.standing * 365 / 100); }
    function billHalf(kwh)  { return bill(kwh) * 0.5; }

    function update(kwh, animate) {
      var fullBill = bill(kwh);
      var ourBill  = billHalf(kwh);
      var sc       = kwh / d.baseline;
      var y1       = Math.round(ourBill);        /* year 1 saving = full - ours = ours (50%) */
      var y10      = Math.round(d.saving10 * sc);
      var y25      = Math.round(d.saving25 * sc);

      /* kWh display */
      set('calc-display', kwh.toLocaleString('en-GB') + '\u2009kWh');

      /* Full Ofgem rate */
      var om = el('calc-ofgem-monthly');
      var oa = el('calc-ofgem-annual');
      if (om) om.textContent = gbp(fullBill / 12);
      if (oa) oa.textContent = gbp(fullBill);

      /* Our rate (50%) */
      var mm = el('calc-monthly');
      var ma = el('calc-annual');
      if (mm) mm.textContent = gbp(ourBill / 12);
      if (ma) ma.textContent = gbp(ourBill);

      /* Savings */
      if (animate) {
        animateTo('calc-y1',  y1,  900);
        animateTo('calc-y10', y10, 1100);
        animateTo('calc-y25', y25, 1300);
      } else {
        set('calc-y1',  gbp(y1),  y1);
        set('calc-y10', gbp(y10), y10);
        set('calc-y25', gbp(y25), y25);
      }

      /* Preset active state */
      presets.forEach(function (btn) {
        btn.classList.toggle('active', parseInt(btn.dataset.kwh, 10) === kwh);
      });
    }

    update(parseInt(slider.value, 10), false);
    slider.addEventListener('input', function () { update(parseInt(this.value, 10), true); });
    presets.forEach(function (btn) {
      btn.addEventListener('click', function () {
        slider.value = this.dataset.kwh;
        update(parseInt(this.dataset.kwh, 10), true);
      });
    });

    /* Share button - present only on calculator.html */
    var shareBtn     = el('share-btn');
    var shareConfirm = el('share-confirm');
    if (shareBtn) {
      shareBtn.addEventListener('click', function () {
        var kwh = parseInt(slider.value, 10);
        var y25 = Math.round(d.saving25 * (kwh / d.baseline));
        var msg = 'I could save \u00a3' + y25.toLocaleString('en-GB')
                + ' over 25 years with We Are Energy Co-operative'
                + ' \u2014 solar and battery storage at no upfront cost.'
                + ' weareenergy.coop #ClimateEmergency #EnergyDemocracy';
        if (navigator.share) {
          navigator.share({ title: 'My We Are Energy savings estimate', text: msg, url: 'https://WeAreEnergy.coop' })
            .then(function () { if (shareConfirm) shareConfirm.hidden = false; });
        } else {
          navigator.clipboard.writeText(msg).then(function () {
            shareBtn.textContent = 'Copied';
            if (shareConfirm) shareConfirm.hidden = false;
            setTimeout(function () { shareBtn.textContent = 'Share my estimate'; }, 3000);
          });
        }
      });
    }
  }

})();
