/**
 * We Are Energy: registration attribution logger (Google Apps Script).
 * Runs alongside your existing registration script and changes nothing it does.
 *
 * 1. In the registration Apps Script project, add this file.
 * 2. Set ATTR_SPREADSHEET_ID to the id of the registrations spreadsheet (the long id in its URL).
 * 3. At the top of your existing doPost(e), add one line:  logAttribution_(e.parameter);
 * 4. Deploy > Manage deployments > Edit > New version > Deploy.
 *
 * It adds an "Attribution" tab. Join it to your registrations by email.
 */
var ATTR_SPREADSHEET_ID = 'PASTE_SPREADSHEET_ID_HERE';
var ATTR_HEADERS = ['timestamp', 'email', 'own_ref_code', 'referred_by', 'utm_source', 'utm_medium',
  'utm_campaign', 'utm_content', 'landing_page', 'referrer', 'page'];

function cleanAttr_(v) {
  v = String(v == null ? '' : v).slice(0, 500);
  return /^[=+\-@]/.test(v) ? "'" + v : v; // stops spreadsheet formula injection
}

function logAttribution_(p) {
  try {
    if (!p || !p['entry.413471257']) return; // email field of the registration form
    var ss = SpreadsheetApp.openById(ATTR_SPREADSHEET_ID);
    var sh = ss.getSheetByName('Attribution') || ss.insertSheet('Attribution');
    if (sh.getLastRow() === 0) sh.appendRow(ATTR_HEADERS);
    sh.appendRow(ATTR_HEADERS.map(function (h) {
      if (h === 'timestamp') return new Date();
      if (h === 'email') return cleanAttr_(p['entry.413471257']);
      return cleanAttr_(p[h]);
    }));
  } catch (err) {
    console.error(err); // never block a registration
  }
}
