import { supabase } from '@/lib/supabase';
import { DailyResult } from '@/lib/types';
import { calculateGrade } from '@/lib/score';
import { Database, Calendar, Building2 } from 'lucide-react';

export default async function DataPage({
  searchParams,
}: {
  searchParams: { date?: string; hall?: string };
}) {
  const date = searchParams?.date || '';
  const hall = searchParams?.hall || '';

  // データ取得
  let query = supabase
    .from('daily_results')
    .select('*')
    .order('play_date', { ascending: false })
    .order('unit_no');

  if (date) query = query.eq('play_date', date);
  if (hall) query = query.ilike('hall_name', `%${hall}%`);

  const { data, error } = await query.limit(1000);

  if (error) {
    console.error('Data fetch error:', error);
  }

  const results = (data || []) as DailyResult[];

  // 日付でグルーピング
  const byDate = new Map<string, DailyResult[]>();
  for (const r of results) {
    if (!byDate.has(r.play_date)) {
      byDate.set(r.play_date, []);
    }
    byDate.get(r.play_date)!.push(r);
  }

  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Database className="text-orange-400" size={28} />
        <h1 className="text-2xl font-black md:text-3xl">データ一覧</h1>
      </div>

      {/* フィルタ */}
      <form className="card p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Calendar size={16} />
              実戦日
            </label>
            <input
              type="date"
              name="date"
              className="input w-full"
              defaultValue={date}
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Building2 size={16} />
              ホール名
            </label>
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
              絞り込み
            </button>
          </div>
        </div>
      </form>

      {/* データ表示 */}
      {dates.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-neutral-500">データがありません</p>
          <a href="/upload" className="btn-sub mt-4 inline-block">
            データを取り込む
          </a>
        </div>
      ) : (
        dates.map((d) => {
          const dayResults = byDate.get(d)!;
          const totalDiff = dayResults.reduce((sum, r) => sum + r.diff, 0);
          const avgDiff = Math.round(totalDiff / dayResults.length);

          return (
            <section key={d} className="card overflow-x-auto p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-orange-400">
                  {new Date(d + 'T00:00:00').toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                  })}
                </h2>
                <div className="text-sm text-neutral-400">
                  {dayResults.length}台 / 合計{totalDiff > 0 ? '+' : ''}
                  {totalDiff}枚 / 平均{avgDiff > 0 ? '+' : ''}
                  {avgDiff}枚
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="table-auto min-w-[720px]">
                  <thead>
                    <tr>
                      <th>台番</th>
                      <th>機種</th>
                      <th className="text-right">G数</th>
                      <th className="text-right">差枚</th>
                      <th className="text-right">BB</th>
                      <th className="text-right">RB</th>
                      <th className="text-center">評価</th>
                      <th>ホール</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayResults.map((r) => {
                      const grade = calculateGrade(r.diff, r.games);
                      return (
                        <tr key={r.id}>
                          <td className="font-bold">{r.unit_no}</td>
                          <td className="text-neutral-300">{r.machine_name}</td>
                          <td className="text-right">{r.games.toLocaleString()}</td>
                          <td
                            className={`text-right font-semibold ${
                              r.diff >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {r.diff > 0 ? '+' : ''}
                            {r.diff.toLocaleString()}
                          </td>
                          <td className="text-right text-neutral-400">{r.bb || '-'}</td>
                          <td className="text-right text-neutral-400">{r.rb || '-'}</td>
                          <td className="text-center">
                            <span className={`badge grade-${grade}`}>{grade}</span>
                          </td>
                          <td className="text-neutral-500">{r.hall_name}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
