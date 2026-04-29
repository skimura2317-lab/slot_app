'use client';
import { useState } from 'react';
export default function UploadPage(){
 const [mode,setMode]=useState('paste'),[text,setText]=useState(''),[date,setDate]=useState(new Date().toISOString().slice(0,10)),[hall,setHall]=useState(''),[msg,setMsg]=useState('');
 async function submit(){setMsg('取込中...'); const res=await fetch('/api/import',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode,text,play_date:date,hall_name:hall})}); const j=await res.json(); setMsg(j.error?`エラー: ${j.error}`:`${j.count}件取り込み完了`);}
 async function file(e:any){const f=e.target.files?.[0]; if(!f)return; setText(await f.text()); setMode(f.name.endsWith('.csv')?'csv':'html');}
 return <div className="space-y-4"><h1 className="text-2xl font-black">データ取込</h1><div className="card grid gap-3 p-4 md:grid-cols-4"><input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)}/><input className="input" placeholder="ホール名" value={hall} onChange={e=>setHall(e.target.value)}/><select className="input" value={mode} onChange={e=>setMode(e.target.value)}><option value="paste">表貼り付け</option><option value="csv">CSV</option><option value="html">HTML</option></select><input className="input" type="file" accept=".csv,.html,.htm,.txt" onChange={file}/></div><textarea className="input min-h-[45vh] w-full font-mono text-sm" placeholder="ここにHTMLの中身、CSV、表データを貼り付け" value={text} onChange={e=>setText(e.target.value)}/><button className="btn" onClick={submit}>取り込む</button><p className="text-orange-300">{msg}</p></div>
}
