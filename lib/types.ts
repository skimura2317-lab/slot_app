// データベーステーブルの型定義
export type DailyResult = {
  id?: number;
  play_date: string;
  hall_name: string;
  machine_name: string;
  unit_no: number;
  games: number;
  diff: number;
  bb?: number;
  rb?: number;
  source?: string;
  created_at?: string;
};

export type HallMapCell = {
  id?: number;
  hall_name: string;
  map_name: string;
  row_no: number;
  col_no: number;
  unit_no: number | null;
  area?: string | null;
  updated_at?: string;
};

export type Event = {
  id?: number;
  play_date: string;
  hall_name: string;
  event_name: string;
  memo?: string;
  created_at?: string;
};

// UI用の型
export type ImportMode = 'paste' | 'csv' | 'html' | 'manual';

export type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

export type CellPosition = {
  row: number;
  col: number;
};

// 分析結果の型
export type MachineStats = {
  name: string;
  count: number;
  totalGames: number;
  totalDiff: number;
  winCount: number;
  avgDiff: number;
  avgGames: number;
  winRate: number;
};

export type TailStats = {
  tail: string;
  count: number;
  totalDiff: number;
  winCount: number;
  avgDiff: number;
  winRate: number;
};

// 明日狙い目の型
export type TargetMachine = {
  name: string;
  hallName?: string;
  unitNo?: number;
  score: number;
  reason: string;
  avgDiff: number;
  winRate: number;
  sampleCount: number;
};
