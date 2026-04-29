import Link from 'next/link';
import { Upload, Database, Map, BarChart3, Target, Edit } from 'lucide-react';

const features = [
  {
    href: '/upload',
    title: 'データ取込',
    description: 'HTML・CSV・表貼り付け・手入力に対応',
    icon: Upload,
    color: 'text-orange-400',
  },
  {
    href: '/data',
    title: '日付別データ',
    description: '日付・ホールごとに結果を確認',
    icon: Database,
    color: 'text-blue-400',
  },
  {
    href: '/map/edit',
    title: 'マップ編集',
    description: '台番号を実配置に合わせて配置',
    icon: Edit,
    color: 'text-purple-400',
  },
  {
    href: '/map',
    title: 'ホールマップ',
    description: '差枚色分け・並びハイライト表示',
    icon: Map,
    color: 'text-emerald-400',
  },
  {
    href: '/analysis',
    title: '分析',
    description: '機種別・末尾別の成績分析',
    icon: BarChart3,
    color: 'text-cyan-400',
  },
  {
    href: '/tomorrow',
    title: '明日狙い目',
    description: '高設定挙動スコアから候補を表示',
    icon: Target,
    color: 'text-red-400',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ヘッダー */}
      <section className="card p-6 md:p-8">
        <h1 className="text-3xl font-black md:text-4xl">
          スロット分析Webアプリ
        </h1>
        <p className="mt-3 text-neutral-300 md:text-lg">
          データ取込からホール配置マップ、並び検出、明日の狙い目まで。
          スマホ・PC対応の実戦分析ツール。
        </p>
      </section>

      {/* 機能カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map(({ href, title, description, icon: Icon, color }) => (
          <Link
            key={href}
            href={href}
            className="card group p-6 transition hover:border-orange-500 hover:shadow-xl"
          >
            <div className="flex items-start gap-4">
              <div className={`rounded-xl bg-neutral-900 p-3 ${color}`}>
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold group-hover:text-orange-400 transition">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-neutral-400">{description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* フッター情報 */}
      <div className="card p-4 text-center text-sm text-neutral-500">
        <p>データはSupabaseに保存されます。環境変数の設定を忘れずに。</p>
      </div>
    </div>
  );
}
