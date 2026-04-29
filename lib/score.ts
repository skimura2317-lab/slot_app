import { DailyResult, HallMapCell, Grade } from './types';

/**
 * 差枚とG数からグレード評価
 */
export function calculateGrade(diff: number, games: number): Grade {
  let score = 0;

  // G数評価
  if (games >= 7000) score += 25;
  else if (games >= 5000) score += 15;
  else if (games >= 3000) score += 8;
  else if (games >= 1500) score += 3;

  // 差枚評価
  if (diff >= 5000) score += 40;
  else if (diff >= 3000) score += 30;
  else if (diff >= 1500) score += 20;
  else if (diff >= 1000) score += 15;
  else if (diff > 0) score += 5;
  else if (diff <= -3000) score -= 15;
  else if (diff <= -1500) score -= 8;

  if (score >= 60) return 'S';
  if (score >= 45) return 'A';
  if (score >= 30) return 'B';
  if (score >= 15) return 'C';
  return 'D';
}

/**
 * 差枚に応じたセルのCSSクラス
 */
export function getCellColorClass(diff?: number): string {
  if (diff === undefined) return 'bg-neutral-950 border-neutral-800';
  
  if (diff >= 5000) return 'bg-yellow-500 text-black border-yellow-300 font-bold';
  if (diff >= 3000) return 'bg-emerald-500 text-white border-emerald-300';
  if (diff >= 1500) return 'bg-lime-600 text-white border-lime-400';
  if (diff >= 1000) return 'bg-green-700 text-white border-green-400';
  if (diff > 0) return 'bg-blue-700 text-white border-blue-400';
  if (diff <= -3000) return 'bg-red-900 text-white border-red-500';
  if (diff <= -1500) return 'bg-red-800 text-white border-red-400';
  
  return 'bg-neutral-800 text-neutral-300 border-neutral-700';
}

/**
 * 並び検出（横3連続・縦3連続・機種別）
 */
export function detectLines(
  cells: HallMapCell[],
  results: DailyResult[]
): {
  horizontal: Set<string>;
  vertical: Set<string>;
  machine: Set<string>;
} {
  const horizontal = new Set<string>();
  const vertical = new Set<string>();
  const machine = new Set<string>();

  // 台番号 → データのマップ
  const resultByUnit = new Map(results.map(r => [r.unit_no, r]));

  // 行列でグルーピング
  const byRow = new Map<number, Map<number, HallMapCell>>();
  const byCol = new Map<number, Map<number, HallMapCell>>();

  for (const cell of cells) {
    if (!byRow.has(cell.row_no)) byRow.set(cell.row_no, new Map());
    byRow.get(cell.row_no)!.set(cell.col_no, cell);

    if (!byCol.has(cell.col_no)) byCol.set(cell.col_no, new Map());
    byCol.get(cell.col_no)!.set(cell.row_no, cell);
  }

  // 横3連続検出（プラス差枚 + 2500G以上）
  for (const [rowNo, cols] of byRow) {
    const sorted = [...cols.values()].sort((a, b) => a.col_no - b.col_no);
    
    for (let i = 0; i < sorted.length - 2; i++) {
      const trio = sorted.slice(i, i + 3);
      
      // すべてのセルに台番号があるか
      if (trio.some(c => !c.unit_no)) continue;

      // すべて強い台か
      const isStrong = trio.every(c => {
        const r = resultByUnit.get(c.unit_no!);
        return r && r.diff >= 1000 && r.games >= 2500;
      });

      if (isStrong) {
        trio.forEach(c => horizontal.add(`${c.row_no}-${c.col_no}`));
      }
    }
  }

  // 縦3連続検出
  for (const [colNo, rows] of byCol) {
    const sorted = [...rows.values()].sort((a, b) => a.row_no - b.row_no);
    
    for (let i = 0; i < sorted.length - 2; i++) {
      const trio = sorted.slice(i, i + 3);
      
      if (trio.some(c => !c.unit_no)) continue;

      const isStrong = trio.every(c => {
        const r = resultByUnit.get(c.unit_no!);
        return r && r.diff >= 1000 && r.games >= 2500;
      });

      if (isStrong) {
        trio.forEach(c => vertical.add(`${c.row_no}-${c.col_no}`));
      }
    }
  }

  // 機種別並び（同じ機種が3台以上連続でプラス）
  const machineGroups = new Map<string, HallMapCell[]>();
  for (const cell of cells) {
    if (!cell.unit_no) continue;
    const result = resultByUnit.get(cell.unit_no);
    if (!result) continue;

    const key = result.machine_name;
    if (!machineGroups.has(key)) machineGroups.set(key, []);
    machineGroups.get(key)!.push(cell);
  }

  for (const [machineName, machineCells] of machineGroups) {
    if (machineCells.length < 3) continue;

    // 同じ行に3台以上あるか
    const rowGroups = new Map<number, HallMapCell[]>();
    for (const cell of machineCells) {
      if (!rowGroups.has(cell.row_no)) rowGroups.set(cell.row_no, []);
      rowGroups.get(cell.row_no)!.push(cell);
    }

    for (const [rowNo, cellsInRow] of rowGroups) {
      if (cellsInRow.length < 3) continue;
      
      const sorted = cellsInRow.sort((a, b) => a.col_no - b.col_no);
      
      // 連続する3台を探す
      for (let i = 0; i < sorted.length - 2; i++) {
        const trio = sorted.slice(i, i + 3);
        
        // 列番号が連続しているか
        const isContinuous =
          trio[1].col_no === trio[0].col_no + 1 &&
          trio[2].col_no === trio[1].col_no + 1;
        
        if (!isContinuous) continue;

        // すべてプラス差枚か
        const allPositive = trio.every(c => {
          const r = resultByUnit.get(c.unit_no!);
          return r && r.diff > 0;
        });

        if (allPositive) {
          trio.forEach(c => machine.add(`${c.row_no}-${c.col_no}`));
        }
      }
    }
  }

  return { horizontal, vertical, machine };
}

/**
 * 台番号から末尾を取得
 */
export function getUnitTail(unitNo: number): string {
  return String(unitNo).slice(-1);
}

/**
 * 複数日のデータから連続性をチェック
 */
export function detectConsecutiveWins(
  results: DailyResult[],
  unitNo: number,
  days: number = 3
): boolean {
  const filtered = results
    .filter(r => r.unit_no === unitNo)
    .sort((a, b) => new Date(b.play_date).getTime() - new Date(a.play_date).getTime())
    .slice(0, days);

  if (filtered.length < days) return false;

  return filtered.every(r => r.diff >= 1000 && r.games >= 2000);
}
