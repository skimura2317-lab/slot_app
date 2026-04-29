import { supabase } from '@/lib/supabase';
export default async function Tomorrow({searchParams}:{searchParams:any}){
 const hall=searchParams?.hall||''; let q=supabase.from('daily_results').select('*'); if(hall)q=q.ilike('hall_name',`%${hall}%`); const {data=[]}=await q.limit(10000); const rows:any[]=data||[];
 const map=new Map<string,{count:number,win:number,diff:number,games:number}>();
 rows.forEach(r=>{const v=map.get(r.machine_name)||{count:0,win:0,diff:0,games:0}; v.count++; v.win+=r.diff>0?1:0; v.diff+=r.diff; v.games+=r.games; map.set(r.machine_name,v);});
 const picks=[...map.entries()].map(([name,v])=>{const avg=v.diff/v.count, win=v.win/v.count; const score=Math.round(avg/100 + win*40 + Math.min(v.count,20)); return {name,count:v.count,avg:Math.round(avg),win:Math.round(win*100),score};}).filter(x=>x.count>=2).sort((a,b)=>b.score-a.score).slice(0,10);
 return <div className="space-y-4"><h1 className="text-2xl font-black">明日狙い目</h1><form className="card grid gap-3 p-4 md:grid-cols-3"><input className="input" name="hall" placeholder="ホール名" defaultValue={hall}/><button className="btn">生成</button></form><div className="grid gap-3">{picks.map((p,i)=><div key={p.name} className="card p-4"><div className="text-lg font-black text-orange-400">{i+1}. {p.name}</div><p className="text-sm text-neutral-300">スコア {p.score} / 平均差枚 {p.avg}枚 / 勝率 {p.win}% / サンプル {p.count}台</p><p className="mt-2 text-sm">根拠：過去データ上の平均差枚・勝率・サンプル数を合算。実戦では当日のイベント・入場番号・設置位置と併用。</p></div>)}</div></div>
}
