import { supabase } from '@/lib/supabase';
import { DailyResult, TargetMachine } from '@/lib/types';
import { calculateGrade } from '@/lib/score';
import { Target, TrendingUp, Award } from 'lucide-react';

export default async function TomorrowPage({
  searchParams,
}: {
  searchParams: { hall?: string; days?: string };
}) {
  const hall = searchParams?.hall || '';
  const days = Number(searchParams?.days) || 7;

  // データ取得（過去N日分）
  let query = supabase
    .from('daily_results')
    .select('*')
    .gte('play_date', getPastDate(days))
    .order('play_date', { ascending: false });

  if (hall) query = query.ilike('hall_name', `%${hall}%`);

  const { data } = await query.limit(10000);
  const results = (data || []) as DailyResult[];

  // 台番号ごとに集計
  const unitStats = new Map<
    number,
    {
      unitNo: number;
      machineName: string;
      hallName: string;
      dates: string[];
      totalDiff: number;
      totalGames: number;
      winCount: number;
      gradeS: number;
      gradeA: number;
    }
  >();

  for (const r of results) {
    const stats = unitStats.get(r.unit_no) || {
      unitNo: r.unit_no,
      machineName: r.machine_name,
      hallName: r.hall_name,
      dates: [],
      totalDiff: 0,
      totalGames: 0,
      winCount: 0,
      gradeS: 0,
      gradeA: 0,
    };

    stats.dates.push(r.play_date);
    stats.totalDiff += r.diff;
    stats.totalGames += r.games;
    if (r.diff > 0) stats.winCount++;

    const grade = calculateGrade(r.diff, r.games);
    if (grade === 'S') stats.gradeS++;
    if (grade === 'A') stats.gradeA++;

    unitStats.set(r.unit_no, stats);
  }

  // スコアリング
  const targets: TargetMachine[] = [];
  for (const [unitNo, stats] of unitStats) {
    const count = stats.dates.length;
    if (count < 2) continue; // 最低2日分必要

    const avgDiff = Math.round(stats.totalDiff / count);
    const avgGames = Math.round(stats.totalGames / count);
    const winRate = Math.round((stats.winCount / count) * 100);

    // スコア計算
    let score = 0;

    // 差枚評価（最重要）
    score += avgDiff / 50;

    // 勝率評価
    score += winRate * 0.5;

    // G数評価（稼働重視）
    if (avgGames >= 6000) score += 20;
    else if (avgGames >= 4000) score += 10;

    // グレード評価
    score += stats.gradeS * 15;
    score += stats.gradeA * 8;

    // 連続性評価（連続出現日数）
    const uniqueDates = new Set(stats.dates).size;
    if (uniqueDates >= 5) score += 25;
    else if (uniqueDates >= 3) score += 15;

    score = Math.round(score);

    // 理由生成
    const reasons = [];
    if (avgDiff >= 2000) reasons.push('高差枚');
    if (winRate >= 70) reasons.push('高勝率');
    if (avgGames >= 5000) reasons.push('高稼働');
    if (stats.gradeS >= 2) reasons.push(`S評価${stats.gradeS}回`);
    if (stats.gradeA >= 3) reasons.push(`A評価${stats.gradeA}回`);
    if (uniqueDates >= 4) reasons.push(`${uniqueDates}日連続`);

    targets.push({
      name: stats.machineName,
      hallName: stats.hallName,
      unitNo,
      score,
      reason: reasons.join(' / '),
      avgDiff,
      winRate,
      sampleCount: count,
    });
  }

  // スコア順にソート
  targets.sort((a, b) => b.score - a.score);
  const topTargets = targets.slice(0, 20);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Target className="text-orange-400" size={28} />
        <h1 className="text-2xl font-black md:text-3xl">明日狙い目</h1>
      </div>

      {/* フィルタ */}
      <form className="card p-4">
        <div className="grid gap-4 md:grid-cols-3">
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

          <div>
            <label className="mb-2 block text-sm font-semibold">過去日数</label>
            <select name="days" className="input w-full" defaultValue={days}>
              <option value="3">3日</option>
              <option value="7">7日（推奨）</option>
              <option value="14">14日</option>
              <option value="30">30日</option>
            </select>
          </div>

          <div className="flex items-end">
            <button type="submit" className="btn w-full">
              生成
            </button>
          </div>
        </div>
      </form>

      {/* 説明 */}
      <div className="card p-4">
        <p className="text-sm text-neutral-400">
          過去{days}
          日間のデータから、差枚・勝率・稼働・グレード・連続性を総合的にスコアリングし、高設定が期待できる台を抽出します。
        </p>
      </div>

      {/* 候補リスト */}
      {topTargets.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-neutral-500">
            該当する候補がありません。条件を変更してください。
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {topTargets.map((target, i) => (
            <div
              key={`${target.hallName}-${target.unitNo}`}
              className="card p-6 transition hover:border-orange-500"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full font-black ${
                        i === 0
                          ? 'bg-yellow-500 text-black'
                          : i === 1
                          ? 'bg-neutral-400 text-black'
                          : i === 2
                          ? 'bg-orange-700 text-white'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-orange-400">
                        {target.name}
                      </h3>
                      <p className="text-sm text-neutral-400">
                        {target.hallName} / 台番{target.unitNo}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    <div className="flex items-center gap-2">
                      <Award className="text-orange-400" size={16} />
                      <div>
                        <div className="text-xs text-neutral-500">スコア</div>
                        <div className="text-lg font-bold text-orange-400">
                          {target.score}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-neutral-500">平均差枚</div>
                      <div
                        className={`text-lg font-bold ${
                          target.avgDiff >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {target.avgDiff > 0 ? '+' : ''}
                        {target.avgDiff.toLocaleString()}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-neutral-500">勝率</div>
                      <div className="text-lg font-bold text-blue-400">
                        {target.winRate}%
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <TrendingUp className="text-neutral-500" size={14} />
                    <p className="text-sm text-neutral-400">{target.reason}</p>
                  </div>

                  <p className="mt-2 text-xs text-neutral-600">
                    サンプル: {target.sampleCount}日分
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// N日前の日付を取得
function getPastDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}
