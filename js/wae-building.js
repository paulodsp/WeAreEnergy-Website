/* ==========================================================
   We Are Energy - wae-building.js
   future.html only. Load after wae-forms.js.
   Handles the "Offer a roof or building" form.
   ========================================================== */
(function () {
  'use strict';
  var W = window.WAE, form = document.getElementById('building-form');
  if (!W || !form) return;
  var EMAIL = 'partnerships@weareenergy.coop';

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var status = document.getElementById('building-status');
    var btn = form.querySelector('button[type="submit"]');
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      status.textContent = 'Please complete the required fields.';
      return;
    }
    if (form.elements.website.value) return; /* spam trap */
    var fd = new FormData(form);
    fd.delete('website');
    W.extras(fd, '');
    W.track('wae_building_enquiry', { org_type: form.elements.org_type.value, utm_source: W.attr.utm_source, utm_campaign: W.attr.utm_campaign });

    if (!W.cfg.buildingEndpoint) {
      var lines = [];
      fd.forEach(function (v, k) { if (v) lines.push(k.replace(/_/g, ' ') + ': ' + v); });
      window.location.href = 'mailto:' + EMAIL + '?subject=' +
        encodeURIComponent('Building enquiry: ' + form.elements.org_name.value) +
        '&body=' + encodeURIComponent(lines.join('\n'));
      status.textContent = 'Your email app should open with the details filled in. Please press send.';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'Sending…';
    fetch(W.cfg.buildingEndpoint, { method: 'POST',mode: 'no-cors', body: fd })
      .then(function () {
        form.reset();
        btn.textContent = 'Sent';
        status.textContent = 'Thank you. We will be in touch to arrange a conversation.';
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = 'Send enquiry';
        status.textContent = 'Sorry, something went wrong. Please email ' + EMAIL + '.';
      });
  });
}());
