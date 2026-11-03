/**
 * We Are Energy: building enquiry form handler (Google Apps Script).
 *
 * Setup
 * 1. Create a new Google Sheet (for example "WAE Building Enquiries").
 * 2. Extensions > Apps Script. Paste this file over the default code and save.
 * 3. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 * 4. Approve the permissions (sheet access and sending email), copy the web app URL.
 * 5. Paste that URL into BUILDING_URL in the script block of future.html.
 *
 * Until step 5 is done the form opens a pre-filled email to NOTIFY instead.
 */
var NOTIFY = 'partnerships@weareenergy.coop';
var HEADERS = ['timestamp', 'org_name', 'org_type', 'contact_name', 'contact_role', 'contact_email',
  'contact_phone', 'location', 'scale', 'message', 'consent', 'utm_source', 'utm_medium',
  'utm_campaign', 'utm_content', 'referred_by', 'landing_page'];

function clean_(v) {
  v = String(v == null ? '' : v).slice(0, 2000);
  return /^[=+\-@]/.test(v) ? "'" + v : v; // stops spreadsheet formula injection
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  if (p.website || !p.contact_email || !p.org_name) return ContentService.createTextOutput('ok');
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Buildings') || ss.insertSheet('Buildings');
    if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
    sh.appendRow(HEADERS.map(function (h) { return h === 'timestamp' ? new Date() : clean_(p[h]); }));
    var body = HEADERS.slice(1).map(function (h) { return h + ': ' + clean_(p[h]); }).join('\n');
    MailApp.sendEmail(NOTIFY, 'Building enquiry: ' + clean_(p.org_name), body);
  } finally {
    lock.release();
  }
  return ContentService.createTextOutput('ok');
}
