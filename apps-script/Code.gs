/**
 * GymGuru → Google Sheet sync.
 *
 * Paste this whole file into Extensions → Apps Script of your Google Sheet, then
 * Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Copy the web app URL into GymGuru → Settings → Google Sheet sync.
 *
 * Every saved workout is written to the "GymGuru Log" tab, one row per completed set.
 * The first app that connects claims this script with its sync key; requests with any
 * other key are refused. To connect a different phone without its backup, delete the
 * SYNC_KEY entry under Project Settings → Script Properties, then connect again.
 */

var LOG_SHEET = 'GymGuru Log';
var HEADER = ['Session', 'Date', 'Week', 'Day', 'Exercise', 'Set', 'Weight (kg)', 'Reps', 'RPE', 'Exercise ID', 'Saved at'];
var MAX_ROWS_PER_SESSION = 500;

function doGet(e) {
  return respond_(handle_(e && e.parameter ? e.parameter : {}));
}

function doPost(e) {
  var req;
  try {
    req = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond_({ ok: false, error: 'Bad request' });
  }
  return respond_(handle_(req));
}

function handle_(req) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var denied = checkKey_(req.key);
    if (denied) return denied;
    switch (req.action) {
      case 'ping':
        return { ok: true, sheet: SpreadsheetApp.getActive().getName() };
      case 'save':
        return saveSession_(req.session);
      case 'export':
        return { ok: true, rows: readRows_() };
      default:
        return { ok: false, error: 'Unknown action' };
    }
  } finally {
    lock.releaseLock();
  }
}

// The first app to connect claims the script; after that only its key is accepted.
function checkKey_(key) {
  if (typeof key !== 'string' || key.length < 32) return { ok: false, error: 'Missing sync key' };
  var props = PropertiesService.getScriptProperties();
  var saved = props.getProperty('SYNC_KEY');
  if (!saved) {
    props.setProperty('SYNC_KEY', key);
    return null;
  }
  return saved === key ? null : { ok: false, error: 'Wrong sync key' };
}

function saveSession_(s) {
  if (
    !s ||
    !/^w\d+:d\d$/.test(s.key) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(s.date) ||
    !Array.isArray(s.rows) ||
    s.rows.length > MAX_ROWS_PER_SESSION
  ) {
    return { ok: false, error: 'Bad session' };
  }
  var sheet = logSheet_();

  // Saving a day again replaces its rows.
  var last = sheet.getLastRow();
  if (last > 1) {
    var keys = sheet.getRange(2, 1, last - 1, 1).getValues();
    var i = keys.length - 1;
    while (i >= 0) {
      if (keys[i][0] !== s.key) {
        i--;
        continue;
      }
      var end = i;
      while (i >= 0 && keys[i][0] === s.key) i--;
      sheet.deleteRows(i + 3, end - i);
    }
  }

  if (s.rows.length) {
    var values = s.rows.map(function (r) {
      return [s.key, s.date, num_(s.week), text_(s.day), text_(r.exercise), num_(r.set), num_(r.weight), num_(r.reps), num_(r.rpe), text_(r.exerciseId), text_(s.savedAt)];
    });
    sheet.getRange(sheet.getLastRow() + 1, 1, values.length, HEADER.length).setValues(values);
  }
  return { ok: true, rows: s.rows.length };
}

function readRows_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(LOG_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var tz = ss.getSpreadsheetTimeZone();
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, HEADER.length)
    .getValues()
    .map(function (r) {
      return {
        session: String(r[0]),
        date: isDate_(r[1]) ? Utilities.formatDate(r[1], tz, 'yyyy-MM-dd') : String(r[1]),
        week: r[2],
        day: String(r[3]),
        exercise: String(r[4]),
        set: r[5],
        weight: r[6],
        reps: r[7],
        rpe: r[8],
        exerciseId: String(r[9]),
        savedAt: isDate_(r[10]) ? r[10].toISOString() : String(r[10]),
      };
    });
}

function logSheet_() {
  var ss = SpreadsheetApp.getActive();
  var sheet = ss.getSheetByName(LOG_SHEET);
  if (sheet) return sheet;
  sheet = ss.insertSheet(LOG_SHEET);
  sheet.getRange(1, 1, 1, HEADER.length).setValues([HEADER]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.getRange('A:A').setNumberFormat('@');
  sheet.getRange('B:B').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('D:E').setNumberFormat('@');
  sheet.getRange('J:K').setNumberFormat('@');
  return sheet;
}

function isDate_(v) {
  return Object.prototype.toString.call(v) === '[object Date]';
}

// Plain text only: never let a value start like a formula.
function text_(v) {
  return String(v == null ? '' : v)
    .replace(/^[=+\-@]+/, '')
    .slice(0, 100);
}

function num_(v) {
  if (v === '' || v == null) return '';
  var n = Number(v);
  return isFinite(n) ? n : '';
}

function respond_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
