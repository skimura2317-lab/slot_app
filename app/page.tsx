import Link from 'next/link';
export default function Home(){
 const cards=[['/upload','データ取込','HTML/CSV/表貼り付け/手入力を登録'],['/data','日付別データ','日付・ホールごとに結果確認'],['/map/edit','マップ編集','台番号を実配置に合わせて配置'],['/map','ホールマップ','差枚色分け＋並びハイライト'],['/analysis','分析','機種/末尾/ランキング'],['/tomorrow','明日狙い目','高設定挙動スコアから候補表示']];
 return <div className="space-y-6"><section className="card p-6"><h1 className="text-3xl font-black">身内用スロット分析Webアプリ v1</h1><p className="mt-3 text-neutral-300">スマホ・PC対応。データ取込、マップ編集、並び検出、狙い目表示までの初期版。</p></section><div className="grid gap-4 md:grid-cols-3">{cards.map(([href,t,d])=><Link href={href} key={href} className="card p-5 hover:border-orange-500"><div className="text-xl font-bold text-orange-400">{t}</div><p className="mt-2 text-sm text-neutral-300">{d}</p></Link>)}</div></div>
}
