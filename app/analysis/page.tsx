import { supabase } from '@/lib/supabase';
export default async function Analysis({searchParams}:{searchParams:any}){
 const hall=searchParams?.hall||'', date=searchParams?.date||'';
 let q=supabase.from('daily_results').select('*'); if(hall)q=q.ilike('hall_name',`%${hall}%`); if(date)q=q.eq('play_date',date); const {data=[]}=await q.limit(5000);
 const rows:any[]=data||[];
 const machine=new Map<string,{count:number,win:number,diff:number,games:number}>(); const tails=new Map<string,{count:number,win:number,diff:number}>();
 rows.forEach(r=>{const m=machine.get(r.machine_name)||{count:0,win:0,diff:0,games:0};m.count++;m.win+=r.diff>0?1:0;m.diff+=r.diff;m.games+=r.games;machine.set(r.machine_name,m); const t=String(r.unit_no).slice(-1); const a=tails.get(t)||{count:0,win:0,diff:0};a.count++;a.win+=r.diff>0?1:0;a.diff+=r.diff;tails.set(t,a);});
 const ml=[...machine.entries()].map(([name,v])=>({name,...v,avg:Math.round(v.diff/v.count),winRate:Math.round(v.win/v.count*100)})).sort((a,b)=>b.avg-a.avg).slice(0,30);
 const tl=[...tails.entries()].map(([tail,v])=>({tail,...v,avg:Math.round(v.diff/v.count),winRate:Math.round(v.win/v.count*100)})).sort((a,b)=>b.avg-a.avg);
 return <div className="space-y-4"><h1 className="text-2xl font-black">分析</h1><form className="card grid gap-3 p-4 md:grid-cols-4"><input className="input" type="date" name="date" defaultValue={date}/><input className="input" name="hall" placeholder="ホール名" defaultValue={hall}/><button className="btn">分析</button></form><section className="card overflow-x-auto p-4"><h2 className="text-xl font-bold text-orange-400">機種別</h2><table className="w-full min-w-[620px] text-sm"><tbody>{ml.map(x=><tr className="border-t border-neutral-800" key={x.name}><td className="py-2 font-bold">{x.name}</td><td>平均{x.avg}枚</td><td>勝率{x.winRate}%</td><td>{x.count}台</td></tr>)}</tbody></table></section><section className="card p-4"><h2 className="text-xl font-bold text-orange-400">末尾</h2><div className="grid grid-cols-2 gap-2 md:grid-cols-5">{tl.map(x=><div className="rounded-xl bg-neutral-900 p-3" key={x.tail}><b>末尾{x.tail}</b><br/>平均{x.avg}枚<br/>勝率{x.winRate}%</div>)}</div></section></div>
}
