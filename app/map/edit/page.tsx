'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
export default function MapEdit(){
 const [hall,setHall]=useState(''),[rows,setRows]=useState(20),[cols,setCols]=useState(30),[cells,setCells]=useState<any[]>([]),[msg,setMsg]=useState('');
 async function load(){ if(!hall)return; const {data}=await supabase.from('hall_maps').select('*').eq('hall_name',hall).eq('map_name','main').order('row_no').order('col_no'); setCells(data||[]); }
 useEffect(()=>{load()},[hall]);
 async function make(){setMsg('作成中...'); const r=await fetch('/api/map',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({hall_name:hall,rows,cols})}); const j=await r.json(); setMsg(j.error||`${j.count}セル作成`); load();}
 async function edit(c:any){ const unit=prompt('台番号（空欄で削除）', c.unit_no||''); if(unit===null)return; await fetch('/api/map',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({...c,hall_name:hall,unit_no:unit})}); load();}
 const maxCol=Math.max(cols,...cells.map(c=>c.col_no||0),1), maxRow=Math.max(rows,...cells.map(c=>c.row_no||0),1);
 const by=new Map(cells.map(c=>[`${c.row_no}-${c.col_no}`,c]));
 return <div className="space-y-4"><h1 className="text-2xl font-black">ホールマップ編集</h1><div className="card grid gap-3 p-4 md:grid-cols-5"><input className="input" placeholder="ホール名" value={hall} onChange={e=>setHall(e.target.value)}/><input className="input" type="number" value={rows} onChange={e=>setRows(Number(e.target.value))}/><input className="input" type="number" value={cols} onChange={e=>setCols(Number(e.target.value))}/><button className="btn" onClick={make}>空マップ作成</button><span className="text-orange-300">{msg}</span></div><div className="overflow-auto rounded-2xl border border-neutral-800 p-3"><div className="grid gap-1" style={{gridTemplateColumns:`repeat(${maxCol}, minmax(54px,1fr))`, minWidth:maxCol*58}}>{Array.from({length:maxRow*maxCol},(_,i)=>{const r=Math.floor(i/maxCol)+1,c=i%maxCol+1,cell=by.get(`${r}-${c}`)||{row_no:r,col_no:c,hall_name:hall,map_name:'main'};return <button key={i} onClick={()=>edit(cell)} className="cell bg-neutral-900 hover:border-orange-500">{cell.unit_no||''}</button>})}</div></div></div>
}
