import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
export async function POST(req:Request){
 const b=await req.json(); const sb=adminClient();
 const rows=[]; const hall_name=b.hall_name, map_name=b.map_name||'main';
 for(let r=1;r<=Number(b.rows||10);r++) for(let c=1;c<=Number(b.cols||20);c++) rows.push({hall_name,map_name,row_no:r,col_no:c,unit_no:null});
 const {error}=await sb.from('hall_maps').upsert(rows,{onConflict:'hall_name,map_name,row_no,col_no'});
 if(error)return NextResponse.json({error:error.message},{status:500});
 return NextResponse.json({ok:true,count:rows.length});
}
export async function PATCH(req:Request){
 const b=await req.json(); const sb=adminClient();
 const {error}=await sb.from('hall_maps').upsert({hall_name:b.hall_name,map_name:b.map_name||'main',row_no:b.row_no,col_no:b.col_no,unit_no:b.unit_no?Number(b.unit_no):null,updated_at:new Date().toISOString()},{onConflict:'hall_name,map_name,row_no,col_no'});
 if(error)return NextResponse.json({error:error.message},{status:500});
 return NextResponse.json({ok:true});
}
