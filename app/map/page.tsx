import { supabase } from '@/lib/supabase';
import { cellClass, detectLines, grade } from '@/lib/score';
export default async function MapPage({searchParams}:{searchParams:any}){
 const hall=searchParams?.hall||'', date=searchParams?.date||new Date().toISOString().slice(0,10);
 let cells:any[]=[]; let results:any[]=[];
 if(hall){ const c=await supabase.from('hall_maps').select('*').eq('hall_name',hall).eq('map_name','main').order('row_no').order('col_no'); cells=c.data||[]; const r=await supabase.from('daily_results').select('*').eq('hall_name',hall).eq('play_date',date); results=r.data||[]; }
 const maxCol=Math.max(...cells.map(c=>c.col_no||0),1), maxRow=Math.max(...cells.map(c=>c.row_no||0),1);
 const byCell=new Map(cells.map(c=>[`${c.row_no}-${c.col_no}`,c])); const byUnit=new Map(results.map(r=>[r.unit_no,r])); const lines=detectLines(cells,results);
 return <div className="space-y-4"><h1 className="text-2xl font-black">ホールマップ</h1><form className="card grid gap-3 p-4 md:grid-cols-4"><input className="input" name="date" type="date" defaultValue={date}/><input className="input" name="hall" placeholder="ホール名" defaultValue={hall}/><button className="btn">表示</button><a className="btn-sub text-center" href="/map/edit">マップ編集</a></form>{!hall?<p className="text-neutral-400">ホール名を入れて表示してください。</p>:<div className="overflow-auto rounded-2xl border border-neutral-800 p-3"><div className="grid gap-1" style={{gridTemplateColumns:`repeat(${maxCol}, minmax(70px,1fr))`, minWidth:maxCol*74}}>{Array.from({length:maxRow*maxCol},(_,i)=>{const r=Math.floor(i/maxCol)+1,c=i%maxCol+1,cell:any=byCell.get(`${r}-${c}`); const res=cell?.unit_no?byUnit.get(cell.unit_no):null; const hit=lines.has(`${r}-${c}`); return <div key={i} className={`cell ${cellClass(res?.diff)} ${hit?'ring-4 ring-orange-400':''}`}>{cell?.unit_no?<><b>{cell.unit_no}</b><span>{res?`${res.diff}枚`:''}</span><span>{res?grade(res.diff,res.games):''}</span></>:''}</div>})}</div></div>}</div>
}
