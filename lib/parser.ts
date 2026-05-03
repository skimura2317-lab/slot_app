import { DailyResult } from './types';

// =============================
// 共通ヘルパー
// =============================

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x2F;/gi, '/')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
}

function cleanCell(value: string): string {
  return decodeHtmlEntities(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripHtmlNoise(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<!doctype[\s\S]*?>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<canvas[\s\S]*?<\/canvas>/gi, ' ');
}

// 数値抽出ヘルパー
function extractNumber(value: string): number {
  if (!value) return 0;
  const normalized = value
    .replace(/[＋]/g, '+')
    .replace(/[−－―]/g, '-')
    .replace(/[,，枚Gg回ゲーム]/g, '')
    .replace(/\s/g, '');
  const match = normalized.match(/[+-]?\d+/);
  return match ? Number(match[0]) : 0;
}

// 台番号として妥当かチェック（2〜5桁の数値）
function isValidUnitNo(value: string): boolean {
  const v = value.replace(/[,，\s]/g, '');
  return /^\d{2,5}$/.test(v);
}

function isNumericLike(value: string): boolean {
  if (!value) return false;
  const v = value.replace(/[,，枚Gg回ゲーム%％\.\/\s+-]/g, '');
  return /^\d+$/.test(v);
}

function isBadMachineName(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  if (v.length > 70) return true;
  if (isNumericLike(v)) return true;

  const lower = v.toLowerCase();
  const badWords = [
    'body{', '--wp--', 'preset--', '@media', 'display:', 'margin:', 'padding:',
    'font-', 'background:', 'color:', 'function', 'document.', 'window.',
    'script', 'stylesheet', 'charset', 'viewport', 'canonical', 'google',
    'analytics', 'gtag', 'jquery', 'swiper', 'breadcrumb', 'wp-', 'class=',
    'data-', 'href=', 'src=', 'http://', 'https://', '.css', '.js'
  ];

  if (badWords.some(w => lower.includes(w))) return true;
  if (/[{}<>;]/.test(v)) return true;
  return false;
}

function pickMachineName(cols: string[], unitIndex: number): { machineName: string; machineIndex: number } {
  const candidates: Array<{ value: string; index: number; distance: number }> = [];

  cols.forEach((col, index) => {
    if (index === unitIndex) return;
    if (isBadMachineName(col)) return;
    candidates.push({ value: col, index, distance: Math.abs(index - unitIndex) });
  });

  // 台番の隣を最優先。台番より前後どちらにも対応。
  candidates.sort((a, b) => {
    if (a.distance !== b.distance) return a.distance - b.distance;
    // 近い場合は長めの日本語名を優先
    return b.value.length - a.value.length;
  });

  const best = candidates[0];
  return best ? { machineName: best.value, machineIndex: best.index } : { machineName: '不明', machineIndex: -1 };
}

function buildRowFromColumns(
  cols: string[],
  playDate: string,
  hallName: string,
  source: 'paste' | 'html' | 'csv'
): DailyResult | null {
  const cleanCols = cols.map(cleanCell).filter(Boolean);
  if (cleanCols.length < 3) return null;

  // ヘッダー・ナビ・広告っぽい行を除外
  const joined = cleanCols.join(' ');
  if (/台番号|台番/.test(joined) && /機種/.test(joined)) return null;
  if (/トップ|ホーム|お問い合わせ|プライバシー|ログイン/.test(joined) && cleanCols.length < 6) return null;

  const unitIndex = cleanCols.findIndex(c => isValidUnitNo(c));
  if (unitIndex < 0) return null;

  const unitNo = extractNumber(cleanCols[unitIndex]);
  const { machineName, machineIndex } = pickMachineName(cleanCols, unitIndex);
  if (isBadMachineName(machineName) || machineName === '不明') return null;

  // 台番号・機種名以外の数値を左から拾う
  const numericValues = cleanCols
    .map((col, index) => ({ col, index }))
    .filter(x => x.index !== unitIndex && x.index !== machineIndex)
    .filter(x => /[+-]?\d/.test(x.col))
    .map(x => extractNumber(x.col));

  if (numericValues.length < 2) return null;

  const games = numericValues[0] || 0;
  const diff = numericValues[1] || 0;
  const bb = numericValues[2] || 0;
  const rb = numericValues[3] || 0;

  return {
    play_date: playDate,
    hall_name: hallName,
    machine_name: machineName,
    unit_no: unitNo,
    games,
    diff,
    bb,
    rb,
    source,
  };
}

// =============================
// 貼り付けテキスト / CSV / HTML
// =============================

/**
 * 表貼り付け（タブ/スペース区切り）をパース
 */
export function parsePastedTable(
  text: string,
  playDate: string,
  hallName: string
): DailyResult[] {
  const rows: DailyResult[] = [];
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const cols = line
      .split(/\t|,|\s{2,}/)
      .map(x => x.trim())
      .filter(Boolean);

    const row = buildRowFromColumns(cols, playDate, hallName, 'paste');
    if (row) rows.push(row);
  }

  return dedupeRows(rows);
}

/**
 * CSV形式をパース（ヘッダー自動推定）
 */
export function parseCsv(
  text: string,
  playDate: string,
  hallName: string
): DailyResult[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const rows: DailyResult[] = [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());

  const findIndex = (keywords: string[]) =>
    header.findIndex(h => keywords.some(k => h.includes(k)));

  const indices = {
    date: findIndex(['日付', 'date', '年月日']),
    hall: findIndex(['ホール', 'hall', '店舗', '店名']),
    unit: findIndex(['台番号', 'unit', '台番', '番号']),
    machine: findIndex(['機種', 'machine', '機種名']),
    games: findIndex(['g数', 'ゲーム', 'games', '回転', '総g', '累計']),
    diff: findIndex(['差枚', 'diff', '枚数', '出玉', '差玉']),
    bb: findIndex(['bb', 'ビッグ', 'big']),
    rb: findIndex(['rb', 'レギュラー', 'reg']),
  };

  if (indices.unit < 0 || indices.machine < 0) {
    // ヘッダーが読めないCSVは貼り付け表として再解釈
    return parsePastedTable(text, playDate, hallName).map(r => ({ ...r, source: 'csv' }));
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(x => x.trim());
    const machineName = cols[indices.machine] || '不明';

    const row: DailyResult = {
      play_date: indices.date >= 0 ? cols[indices.date] : playDate,
      hall_name: indices.hall >= 0 ? cols[indices.hall] : hallName,
      machine_name: machineName,
      unit_no: extractNumber(cols[indices.unit]),
      games: indices.games >= 0 ? extractNumber(cols[indices.games]) : 0,
      diff: indices.diff >= 0 ? extractNumber(cols[indices.diff]) : 0,
      bb: indices.bb >= 0 ? extractNumber(cols[indices.bb]) : 0,
      rb: indices.rb >= 0 ? extractNumber(cols[indices.rb]) : 0,
      source: 'csv',
    };

    if (row.unit_no > 0 && !isBadMachineName(row.machine_name)) rows.push(row);
  }

  return dedupeRows(rows);
}

/**
 * HTML形式をパース
 * 重要: CSS/JS/HEADを先に完全除去し、表の行だけを優先抽出する。
 */
export function parseHtml(
  html: string,
  playDate: string,
  hallName: string
): DailyResult[] {
  const cleanedHtml = stripHtmlNoise(html);
  const rows: DailyResult[] = [];

  // 1) table/tr/td があるHTMLを優先して読む
  const trMatches = [...cleanedHtml.matchAll(/<tr[\s\S]*?<\/tr>/gi)];
  for (const trMatch of trMatches) {
    const tr = trMatch[0];
    const cellMatches = [...tr.matchAll(/<(td|th)[^>]*>([\s\S]*?)<\/\1>/gi)];
    if (cellMatches.length < 3) continue;

    const cols = cellMatches.map(m => cleanCell(m[2])).filter(Boolean);
    const row = buildRowFromColumns(cols, playDate, hallName, 'html');
    if (row) rows.push(row);
  }

  if (rows.length > 0) return dedupeRows(rows);

  // 2) table構造が取れないHTMLは、タグを区切りに変換して貼り付け表として読む
  const plain = cleanedHtml
    .replace(/<\/(tr|li|p|div|section|article)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(td|th|span)>/gi, '\t')
    .replace(/<[^>]+>/g, ' ')
    .split(/\r?\n/)
    .map(line => cleanCell(line))
    .filter(line => line && !isBadNoiseLine(line))
    .join('\n');

  return parsePastedTable(plain, playDate, hallName).map(r => ({ ...r, source: 'html' }));
}

function isBadNoiseLine(line: string): boolean {
  const lower = line.toLowerCase();
  if (line.length > 180) return true;
  return [
    '--wp--', 'body{', '@media', 'function', 'document.', 'window.',
    'stylesheet', 'charset', 'viewport', 'canonical', 'analytics', 'gtag',
    'jquery', 'cookie', 'privacy', 'copyright'
  ].some(w => lower.includes(w));
}

function dedupeRows(rows: DailyResult[]): DailyResult[] {
  const map = new Map<string, DailyResult>();
  for (const row of rows) {
    const key = `${row.play_date}__${row.hall_name}__${row.unit_no}`;
    const existing = map.get(key);
    // 同じ台番が重複した場合は、G数が多いほうを優先
    if (!existing || row.games >= existing.games) map.set(key, row);
  }
  return [...map.values()].sort((a, b) => a.unit_no - b.unit_no);
}

/**
 * パース結果のバリデーション
 */
export function validateResults(results: DailyResult[]): {
  valid: DailyResult[];
  errors: string[];
} {
  const valid: DailyResult[] = [];
  const errors: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];

    if (!r.unit_no || r.unit_no < 1 || r.unit_no > 99999) {
      errors.push(`${i + 1}行目: 台番号が不正です (${r.unit_no})`);
      continue;
    }

    if (!r.machine_name || r.machine_name === '不明' || isBadMachineName(r.machine_name)) {
      errors.push(`${i + 1}行目: 機種名が不正です (台番${r.unit_no}: ${r.machine_name})`);
      continue;
    }

    if (r.games < 0 || r.games > 30000) {
      errors.push(`${i + 1}行目: G数が異常です (${r.games}G)`);
      continue;
    }

    if (r.diff < -30000 || r.diff > 30000) {
      errors.push(`${i + 1}行目: 差枚が異常です (${r.diff}枚)`);
      continue;
    }

    valid.push(r);
  }

  return { valid, errors };
}
