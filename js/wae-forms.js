/* ==========================================================
   We Are Energy - wae-forms.js
   Load before </body> on every page with the register form
   (index, about, faqs, future). One place for the endpoints,
   campaign tracking and the registration handler.
   ========================================================== */
(function () {
  'use strict';

  var CFG = {
    endpoint: 'https://script.google.com/macros/s/AKfycbyslRmMzWnnvldT10MUx1Unhp_PwqnbyyEFp5ly-M4XdYST0CblubGb2wgGne69XhQ_/exec',
    buildingEndpoint: 'https://script.google.com/macros/s/AKfycbzWhBbQS94wh-TzlDSujiXl19fD_FX-C5OJQCBH3Y6qURUu7eLJtrBgsRO2tdHSgiz7/exec',   /* web app URL from building-form.gs (future.html only). Empty = opens an email instead */
    thankyou: 'thankyou.html',
    persist: false          /* true keeps campaign tags for 30 days across pages. Stored in the browser, so it needs cookie consent (PECR) */
  };

  /* ---- Campaign tags from the link ---- */
  var q = new URLSearchParams(window.location.search), attr = {};
  if (CFG.persist) {
    try {
      var saved = JSON.parse(localStorage.getItem('wae_attr'));
      if (saved && Date.now() - saved.t < 30 * 24 * 3600 * 1000) attr = saved;
    } catch (err) {}
  }
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(function (k) {
    var v = (q.get(k) || '').trim().slice(0, 80);
    if (v) attr[k] = v;
  });
  var ref = (q.get('ref') || '').trim().toUpperCase();
  if (/^WAE-[A-Z0-9]{3,12}$/.test(ref)) attr.ref = ref;
  if (!attr.landing) attr.landing = window.location.pathname;
  if (!attr.referrer && document.referrer) {
    try {
      var host = new URL(document.referrer).hostname;
      if (host !== window.location.hostname) attr.referrer = host;
    } catch (err) {}
  }
  if (CFG.persist) {
    attr.t = attr.t || Date.now();
    try { localStorage.setItem('wae_attr', JSON.stringify(attr)); } catch (err) {}
  }

  function extras(fd, ownCode) {
    var o = {
      own_ref_code: ownCode, referred_by: attr.ref,
      utm_source: attr.utm_source, utm_medium: attr.utm_medium,
      utm_campaign: attr.utm_campaign, utm_content: attr.utm_content,
      landing_page: attr.landing, referrer: attr.referrer, page: window.location.pathname
    };
    Object.keys(o).forEach(function (k) { if (o[k]) fd.set(k, o[k]); });
  }
  function track(name, data) {
    (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name }, data));
  }
  window.WAE = { cfg: CFG, attr: attr, extras: extras, track: track };

  /* ---- Registration ---- */
  var form = document.getElementById('registration-form');
  var success = document.getElementById('form-success');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.classList.add('was-validated'); return; }
    var btn = form.querySelector('button[type="submit"]'), label = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Sending…';

    /* The member's referral code is made first so it is saved with the registration */
    var letters = document.getElementById('f-name').value.normalize('NFD').replace(/[^A-Za-z ]/g, '').trim();
    var initials = letters.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').toUpperCase().slice(0, 3) || 'X';
    var rnd = new Uint8Array(4);
    window.crypto.getRandomValues(rnd);
    var code = 'WAE-' + initials + Array.prototype.map.call(rnd, function (n) { return (n % 36).toString(36); }).join('').toUpperCase();

    var fd = new FormData(form);
    extras(fd, code);
    fetch(CFG.endpoint, { method: 'POST',mode: 'no-cors', body: fd })
      .then(function () {
        try { localStorage.setItem('wae_ref_code', code); } catch (err) {}
        track('wae_register', { ref_code: code, referred: !!attr.ref, utm_source: attr.utm_source, utm_campaign: attr.utm_campaign });
        form.style.display = 'none';
        if (success) success.style.display = 'block';
        setTimeout(function () { window.location.href = CFG.thankyou + '?c=' + encodeURIComponent(code); }, 2500);
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = label;
        alert('Sorry, something went wrong. Please try again.');
      });
  });
}());
