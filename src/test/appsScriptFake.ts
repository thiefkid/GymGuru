// A small in-memory stand-in for the Google Apps Script services Code.gs uses,
// so the real script can be exercised in tests.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

type Cell = string | number | Date;

class FakeSheet {
  rows: Cell[][] = [];
  frozen = 0;
  name: string;
  constructor(name: string) {
    this.name = name;
  }
  getLastRow() {
    return this.rows.length;
  }
  setFrozenRows(n: number) {
    this.frozen = n;
  }
  deleteRows(start: number, count: number) {
    this.rows.splice(start - 1, count);
  }
  getRange(row: number | string, col = 1, numRows = 1, numCols = 1) {
    const sheet = this;
    if (typeof row === 'string') return { setNumberFormat: () => undefined };
    return {
      getValues: () =>
        Array.from({ length: numRows }, (_, r) => Array.from({ length: numCols }, (_, c) => sheet.rows[row - 1 + r]?.[col - 1 + c] ?? '')),
      setValues(values: Cell[][]) {
        values.forEach((v, r) => {
          const target = (sheet.rows[row - 1 + r] ??= []);
          v.forEach((cell, c) => {
            // Like Sheets, a yyyy-mm-dd string in the date column becomes a date.
            const isDate = col + c === 2 && typeof cell === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(cell);
            target[col - 1 + c] = isDate ? new Date(`${cell}T00:00:00Z`) : cell;
          });
        });
        return this;
      },
      setFontWeight() {
        return this;
      },
    };
  }
}

export function createFakeScript(sheetName = 'shawn') {
  const sheets = new Map<string, FakeSheet>();
  const props = new Map<string, string>();
  const spreadsheet = {
    getName: () => sheetName,
    getSheetByName: (n: string) => sheets.get(n) ?? null,
    insertSheet: (n: string) => {
      const s = new FakeSheet(n);
      sheets.set(n, s);
      return s;
    },
    getSpreadsheetTimeZone: () => 'Etc/UTC',
  };
  const context = vm.createContext({
    SpreadsheetApp: { getActive: () => spreadsheet },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (k: string) => props.get(k) ?? null,
        setProperty: (k: string, v: string) => props.set(k, v),
      }),
    },
    LockService: { getScriptLock: () => ({ waitLock: () => undefined, releaseLock: () => undefined }) },
    Utilities: { formatDate: (d: Date) => d.toISOString().slice(0, 10) },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (text: string) => ({ text, setMimeType: () => ({ text }) }),
    },
  });
  vm.runInContext(readFileSync(new URL('../../apps-script/Code.gs', import.meta.url), 'utf8'), context);

  return {
    sheets,
    props,
    post(body: unknown): unknown {
      const out = context.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } });
      return JSON.parse(out.text);
    },
    get(params: Record<string, string>): unknown {
      return JSON.parse(context.doGet({ parameter: params }).text);
    },
    log(): Cell[][] {
      return sheets.get('GymGuru Log')?.rows ?? [];
    },
  };
}
