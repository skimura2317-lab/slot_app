import { supabase } from '@/lib/supabase';
import { DailyResult, HallMapCell } from '@/lib/types';
import { getCellColorClass, detectLines, calculateGrade } from '@/lib/score';
import { Map as MapIcon, TrendingUp, Edit } from 'lucide-react';
import Link from 'next/link';

export default async function MapPage({
  searchParams,
}: {
  searchParams: { hall?: string; date?: string };
}) {
  const hall = searchParams?.hall || '';
  const date = searchParams?.date || new Date().toISOString().slice(0, 10);

  let cells: HallMapCell[] = [];
  let results: DailyResult[] = [];

  if (hall) {
    // マップ取得
    const { data: cellsData } = await supabase
      .from('hall_maps')
      .select('*')
      .eq('hall_name', hall)
      .eq('map_name', 'main')
      .order('row_no')
      .order('col_no');

    cells = cellsData || [];

    // 実戦データ取得
    const { data: resultsData } = await supabase
      .from('daily_results')
      .select('*')
      .eq('hall_name', hall)
      .eq('play_date', date);

    results = resultsData || [];
  }

  // 並び検出
  const lines = detectLines(cells, results);

  // グリッド描画準備
  const maxRow = Math.max(...cells.map((c) => c.row_no || 0), 1);
  const maxCol = Math.max(...cells.map((c) => c.col_no || 0), 1);
  const cellMap = new Map(cells.map((c) => [`${c.row_no}-${c.col_no}`, c]));
  const resultMap = new Map(results.map((r) => [r.unit_no, r]));

  // 統計
  const totalDiff = results.reduce((sum, r) => sum + r.diff, 0);
  const avgDiff = results.length > 0 ? Math.round(totalDiff / results.length) : 0;
  const winCount = results.filter((r) => r.diff > 0).length;
  const winRate = results.length > 0 ? Math.round((winCount / results.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <MapIcon className="text-orange-400" size={28} />
        <h1 className="text-2xl font-black md:text-3xl">ホールマップ</h1>
      </div>

      {/* フィルタ */}
      <form className="card p-4">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">実戦日</label>
            <input
              type="date"
              name="date"
              className="input w-full"
              defaultValue={date}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">ホール名</label>
            <input
              type="text"
              name="hall"
              className="input w-full"
              placeholder="例: マルハン新宿"
              defaultValue={hall}
            />
          </div>

          <div className="flex items-end">
            <button type="submit" className="btn w-full">
              表示
            </button>
          </div>

          <div className="flex items-end">
            <Link href="/map/edit" className="btn-sub flex w-full items-center justify-center gap-2">
              <Edit size={18} />
              <span>マップ編集</span>
            </Link>
          </div>
        </div>
      </form>

      {!hall ? (
        <div className="card p-12 text-center">
          <p className="text-neutral-500">ホール名を入力してマップを表示してください</p>
        </div>
      ) : cells.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="mb-4 text-neutral-500">
            「{hall}」のマップが見つかりません
          </p>
          <Link href="/map/edit" className="btn-sub inline-block">
            マップを作成する
          </Link>
        </div>
      ) : (
        <>
          {/* 統計カード */}
          {results.length > 0 && (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="card p-4">
                <div className="text-sm text-neutral-400">台数</div>
                <div className="mt-1 text-2xl font-bold">{results.length}台</div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-neutral-400">合計差枚</div>
                <div
                  className={`mt-1 text-2xl font-bold ${
                    totalDiff >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {totalDiff > 0 ? '+' : ''}
                  {totalDiff.toLocaleString()}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-neutral-400">平均差枚</div>
                <div
                  className={`mt-1 text-2xl font-bold ${
                    avgDiff >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {avgDiff > 0 ? '+' : ''}
                  {avgDiff.toLocaleString()}
                </div>
              </div>
              <div className="card p-4">
                <div className="text-sm text-neutral-400">勝率</div>
                <div className="mt-1 text-2xl font-bold text-blue-400">{winRate}%</div>
              </div>
            </div>
          )}

          {/* マップグリッド */}
          <div className="card overflow-auto p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">配置マップ</h2>
              {(lines.horizontal.size > 0 || lines.vertical.size > 0 || lines.machine.size > 0) && (
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp size={16} className="text-orange-400" />
                  <span className="text-neutral-400">
                    並び検出: 横{lines.horizontal.size} / 縦{lines.vertical.size} / 機種
                    {lines.machine.size}
                  </span>
                </div>
              )}
            </div>

            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${maxCol}, minmax(70px, 1fr))`,
                minWidth: maxCol * 74,
              }}
            >
              {Array.from({ length: maxRow * maxCol }, (_, i) => {
                const r = Math.floor(i / maxCol) + 1;
                const c = (i % maxCol) + 1;
                const cell = cellMap.get(`${r}-${c}`);
                const result = cell?.unit_no ? resultMap.get(cell.unit_no) : null;
                const key = `${r}-${c}`;

                const isHorizontal = lines.horizontal.has(key);
                const isVertical = lines.vertical.has(key);
                const isMachine = lines.machine.has(key);
                const hasLine = isHorizontal || isVertical || isMachine;

                let ringClass = '';
                if (isHorizontal && isVertical) ringClass = 'ring-4 ring-yellow-400';
                else if (isHorizontal) ringClass = 'ring-4 ring-orange-400';
                else if (isVertical) ringClass = 'ring-4 ring-blue-400';
                else if (isMachine) ringClass = 'ring-4 ring-purple-400';

                return (
                  <div
                    key={i}
                    className={`cell ${getCellColorClass(result?.diff)} ${ringClass}`}
                    title={
                      result
                        ? `台${result.unit_no}: ${result.machine_name}\n差枚: ${result.diff} / G数: ${result.games}\nBB: ${result.bb} / RB: ${result.rb}`
                        : undefined
                    }
                  >
                    {cell?.unit_no ? (
                      <>
                        <div className="text-base font-bold">{cell.unit_no}</div>
                        {result && (
                          <>
                            <div className="text-xs">
                              {result.diff > 0 ? '+' : ''}
                              {result.diff}
                            </div>
                            <div className="text-[10px] opacity-80">
                              {calculateGrade(result.diff, result.games)}
                            </div>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="text-[10px] text-neutral-700">{`${r}-${c}`}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 凡例 */}
            <div className="mt-6 grid gap-2 md:grid-cols-2">
              <div className="rounded-xl bg-neutral-900 p-3 text-sm">
                <div className="mb-2 font-semibold">差枚色分け</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-yellow-500"></div>
                    <span>5000枚以上</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-emerald-500"></div>
                    <span>3000枚以上</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-lime-600"></div>
                    <span>1500枚以上</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded bg-green-700"></div>
                    <span>1000枚以上</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-neutral-900 p-3 text-sm">
                <div className="mb-2 font-semibold">並び検出</div>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded ring-4 ring-orange-400"></div>
                    <span>横3連続（1000枚以上）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded ring-4 ring-blue-400"></div>
                    <span>縦3連続（1000枚以上）</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded ring-4 ring-purple-400"></div>
                    <span>機種別並び（同機種3台以上）</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
