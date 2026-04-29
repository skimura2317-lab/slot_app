import { supabase } from '@/lib/supabase';
export default async function DataPage({searchParams}:{searchParams:any}){
 const date=searchParams?.date||'', hall=searchParams?.hall||'';
 let q=supabase.from('daily_results').select('*').order('play_date',{ascending:false}).order('unit_no');
 if(date) q=q.eq('play_date',date); if(hall) q=q.ilike('hall_name',`%${hall}%`);
 const {data=[]}=await q.limit(1000);
 const dates=[...new Set((data||[]).map((r:any)=>r.play_date))];
 return <div className="space-y-4"><h1 className="text-2xl font-black">データ一覧</h1><form className="card grid gap-3 p-4 md:grid-cols-4"><input className="input" type="date" name="date" defaultValue={date}/><input className="input" name="hall" placeholder="ホール名" defaultValue={hall}/><button className="btn">絞り込み</button></form>{dates.map(d=><section key={d} className="card overflow-x-auto p-4"><h2 className="mb-3 text-xl font-bold text-orange-400">{d}</h2><table className="w-full min-w-[720px] text-sm"><thead><tr className="text-left text-neutral-400"><th>台</th><th>機種</th><th>G数</th><th>差枚</th><th>BB</th><th>RB</th><th>ホール</th></tr></thead><tbody>{(data||[]).filter((r:any)=>r.play_date===d).map((r:any)=><tr key={r.id} className="border-t border-neutral-800"><td className="py-2 font-bold">{r.unit_no}</td><td>{r.machine_name}</td><td>{r.games}</td><td className={r.diff>=0?'text-emerald-400':'text-red-400'}>{r.diff}</td><td>{r.bb}</td><td>{r.rb}</td><td>{r.hall_name}</td></tr>)}</tbody></table></section>)}</div>
}
