import { supabase } from '@/lib/supabase';
import { DailyResult, MachineStats, TailStats } from '@/lib/types';
import { getUnitTail } from '@/lib/score';
import { BarChart3, TrendingUp, Hash } from 'lucide-react';

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: { hall?: string; date?: string };
}) {
  const hall = searchParams?.hall || '';
  const date = searchParams?.date || '';

  // データ取得
  let query = supabase.from('daily_results').select('*');
  if (hall) query = query.ilike('hall_name', `%${hall}%`);
  if (date) query = query.eq('play_date', date);

  const { data } = await query.limit(5000);
  const results = (data || []) as DailyResult[];

  // 機種別集計
  const machineMap = new Map<string, MachineStats>();
  for (const r of results) {
    const stats = machineMap.get(r.machine_name) || {
      name: r.machine_name,
      count: 0,
      totalGames: 0,
      totalDiff: 0,
      winCount: 0,
      avgDiff: 0,
      avgGames: 0,
      winRate: 0,
    };

    stats.count++;
    stats.totalGames += r.games;
    stats.totalDiff += r.diff;
    if (r.diff > 0) stats.winCount++;

    machineMap.set(r.machine_name, stats);
  }

  // 平均値計算
  const machineStats = [...machineMap.values()].map((s) => ({
    ...s,
    avgDiff: Math.round(s.totalDiff / s.count),
    avgGames: Math.round(s.totalGames / s.count),
    winRate: Math.round((s.winCount / s.count) * 100),
  })).sort((a, b) => b.avgDiff - a.avgDiff);

  // 末尾別集計
  const tailMap = new Map<string, TailStats>();
  for (const r of results) {
    const tail = getUnitTail(r.unit_no);
    const stats = tailMap.get(tail) || {
      tail,
      count: 0,
      totalDiff: 0,
      winCount: 0,
      avgDiff: 0,
      winRate: 0,
    };

    stats.count++;
    stats.totalDiff += r.diff;
    if (r.diff > 0) stats.winCount++;

    tailMap.set(tail, stats);
  }

  const tailStats = [...tailMap.values()]
    .map((s) => ({
      ...s,
      avgDiff: Math.round(s.totalDiff / s.count),
      winRate: Math.round((s.winCount / s.count) * 100),
    }))
    .sort((a, b) => b.avgDiff - a.avgDiff);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <BarChart3 className="text-orange-400" size={28} />
        <h1 className="text-2xl font-black md:text-3xl">分析</h1>
      </div>

      {/* フィルタ */}
      <form className="card p-4">
        <div className="grid gap-4 md:grid-cols-3">
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
              placeholder="部分一致検索"
              defaultValue={hall}
            />
          </div>

          <div className="flex items-end">
            <button type="submit" className="btn w-full">
              分析
            </button>
          </div>
        </div>
      </form>

      {results.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-neutral-500">データがありません</p>
        </div>
      ) : (
        <>
          {/* サマリー */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="card p-4">
              <div className="text-sm text-neutral-400">サンプル数</div>
              <div className="mt-1 text-2xl font-bold">{results.length}台</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-neutral-400">機種数</div>
              <div className="mt-1 text-2xl font-bold">{machineStats.length}</div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-neutral-400">合計差枚</div>
              <div
                className={`mt-1 text-2xl font-bold ${
                  results.reduce((sum, r) => sum + r.diff, 0) >= 0
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {results.reduce((sum, r) => sum + r.diff, 0) > 0 ? '+' : ''}
                {results.reduce((sum, r) => sum + r.diff, 0).toLocaleString()}
              </div>
            </div>
            <div className="card p-4">
              <div className="text-sm text-neutral-400">平均差枚</div>
              <div
                className={`mt-1 text-2xl font-bold ${
                  Math.round(
                    results.reduce((sum, r) => sum + r.diff, 0) / results.length
                  ) >= 0
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {Math.round(results.reduce((sum, r) => sum + r.diff, 0) / results.length) >
                0
                  ? '+'
                  : ''}
                {Math.round(
                  results.reduce((sum, r) => sum + r.diff, 0) / results.length
                ).toLocaleString()}
              </div>
            </div>
          </div>

          {/* 機種別ランキング */}
          <section className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp className="text-orange-400" size={24} />
              <h2 className="text-xl font-bold">機種別ランキング（TOP20）</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="table-auto min-w-[720px]">
                <thead>
                  <tr>
                    <th className="text-center">順位</th>
                    <th>機種名</th>
                    <th className="text-right">平均差枚</th>
                    <th className="text-right">平均G数</th>
                    <th className="text-right">勝率</th>
                    <th className="text-right">サンプル数</th>
                  </tr>
                </thead>
                <tbody>
                  {machineStats.slice(0, 20).map((m, i) => (
                    <tr key={m.name}>
                      <td className="text-center font-bold text-orange-400">
                        {i + 1}
                      </td>
                      <td className="font-semibold">{m.name}</td>
                      <td
                        className={`text-right font-semibold ${
                          m.avgDiff >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {m.avgDiff > 0 ? '+' : ''}
                        {m.avgDiff.toLocaleString()}
                      </td>
                      <td className="text-right text-neutral-300">
                        {m.avgGames.toLocaleString()}
                      </td>
                      <td className="text-right text-blue-400">{m.winRate}%</td>
                      <td className="text-right text-neutral-500">{m.count}台</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 末尾別分析 */}
          <section className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Hash className="text-orange-400" size={24} />
              <h2 className="text-xl font-bold">末尾別分析</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-5">
              {tailStats.map((t) => (
                <div
                  key={t.tail}
                  className="rounded-xl bg-neutral-900 p-4 transition hover:bg-neutral-800"
                >
                  <div className="mb-2 text-2xl font-black text-orange-400">
                    末尾 {t.tail}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">平均差枚</span>
                      <span
                        className={`font-semibold ${
                          t.avgDiff >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {t.avgDiff > 0 ? '+' : ''}
                        {t.avgDiff.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">勝率</span>
                      <span className="font-semibold text-blue-400">{t.winRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">サンプル</span>
                      <span className="text-neutral-300">{t.count}台</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
