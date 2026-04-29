import { DailyResult } from './types';

// 数値抽出ヘルパー
function extractNumber(value: string): number {
  if (!value) return 0;
  // カンマ、枚、G、回などを除去して数値抽出
  const cleaned = value.replace(/[,枚G回ゲーム]/g, '');
  const match = cleaned.match(/-?\d+/);
  return match ? Number(match[0]) : 0;
}

// 台番号として妥当かチェック（2〜5桁の数値）
function isValidUnitNo(value: string): boolean {
  return /^\d{2,5}$/.test(value);
}

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
    // タブ、カンマ、2つ以上のスペースで区切る
    const cols = line
      .split(/\t|,|\s{2,}/)
      .map(x => x.trim())
      .filter(Boolean);

    if (cols.length < 4) continue; // 最低4列（機種、台番、G数、差枚）

    // 台番号のインデックスを探す
    const unitIndex = cols.findIndex(c => isValidUnitNo(c));
    if (unitIndex < 0) continue;

    const unitNo = Number(cols[unitIndex]);
    
    // 機種名は台番号より前のすべてを結合
    const machineName = cols.slice(0, unitIndex).join(' ').trim() || cols[unitIndex + 1] || '不明';
    
    // 台番号より後ろの数値を抽出
    const nums = cols.slice(unitIndex + 1).map(extractNumber);

    rows.push({
      play_date: playDate,
      hall_name: hallName,
      machine_name: machineName,
      unit_no: unitNo,
      games: nums[0] || 0,
      diff: nums[1] || 0,
      bb: nums[2] || 0,
      rb: nums[3] || 0,
      source: 'paste',
    });
  }

  return rows;
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
  if (lines.length < 2) return []; // ヘッダー + 最低1行必要

  const rows: DailyResult[] = [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());

  // カラムインデックスを推定
  const findIndex = (keywords: string[]) =>
    header.findIndex(h => keywords.some(k => h.includes(k)));

  const indices = {
    date: findIndex(['日付', 'date', '年月日']),
    hall: findIndex(['ホール', 'hall', '店舗', '店名']),
    unit: findIndex(['台番号', 'unit', '台番', '番号']),
    machine: findIndex(['機種', 'machine', '機種名']),
    games: findIndex(['g数', 'ゲーム', 'games', '回転', '総g']),
    diff: findIndex(['差枚', 'diff', '枚数', '収支']),
    bb: findIndex(['bb', 'ビッグ', 'big']),
    rb: findIndex(['rb', 'レギュラー', 'reg']),
  };

  // 台番号と機種名は必須
  if (indices.unit < 0 || indices.machine < 0) {
    console.warn('CSVに台番号または機種名の列が見つかりません');
    return [];
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(x => x.trim());

    const row: DailyResult = {
      play_date: indices.date >= 0 ? cols[indices.date] : playDate,
      hall_name: indices.hall >= 0 ? cols[indices.hall] : hallName,
      machine_name: cols[indices.machine] || '不明',
      unit_no: extractNumber(cols[indices.unit]),
      games: indices.games >= 0 ? extractNumber(cols[indices.games]) : 0,
      diff: indices.diff >= 0 ? extractNumber(cols[indices.diff]) : 0,
      bb: indices.bb >= 0 ? extractNumber(cols[indices.bb]) : 0,
      rb: indices.rb >= 0 ? extractNumber(cols[indices.rb]) : 0,
      source: 'csv',
    };

    // 台番号が有効な場合のみ追加
    if (row.unit_no > 0) {
      rows.push(row);
    }
  }

  return rows;
}

/**
 * HTML形式をパース（タグ除去後に表形式として処理）
 */
export function parseHtml(
  html: string,
  playDate: string,
  hallName: string
): DailyResult[] {
  // HTMLタグを改行/タブに変換
  let plain = html
    .replace(/<\/(tr|p|div|br)>/gi, '\n')
    .replace(/<\/(td|th)>/gi, '\t')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

  const result = parsePastedTable(plain, playDate, hallName);
  return result.map(r => ({ ...r, source: 'html' }));
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

    // 台番号チェック
    if (!r.unit_no || r.unit_no < 1 || r.unit_no > 99999) {
      errors.push(`${i + 1}行目: 台番号が不正です (${r.unit_no})`);
      continue;
    }

    // 機種名チェック
    if (!r.machine_name || r.machine_name === '不明') {
      errors.push(`${i + 1}行目: 機種名が不明です (台番${r.unit_no})`);
      continue;
    }

    // G数チェック（負の値や異常値）
    if (r.games < 0 || r.games > 20000) {
      errors.push(`${i + 1}行目: G数が異常です (${r.games}G)`);
      continue;
    }

    // 差枚チェック（異常値）
    if (r.diff < -15000 || r.diff > 15000) {
      errors.push(`${i + 1}行目: 差枚が異常です (${r.diff}枚)`);
      continue;
    }

    valid.push(r);
  }

  return { valid, errors };
}
