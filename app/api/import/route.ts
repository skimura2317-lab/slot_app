import { NextResponse } from 'next/server';
import { adminClient } from '@/lib/supabase';
import { parseCsv, parseHtml, parsePastedTable } from '@/lib/parser';
export async function POST(req:Request){
 const body=await req.json();
 const { mode, text, play_date, hall_name } = body;
 if(!play_date || !hall_name || !text) return NextResponse.json({error:'日付・ホール名・データが必要です'}, {status:400});
 let rows = mode==='csv'?parseCsv(text,play_date,hall_name):mode==='html'?parseHtml(text,play_date,hall_name):parsePastedTable(text,play_date,hall_name);
 rows = rows.filter(r=>r.unit_no && r.machine_name);
 if(rows.length===0) return NextResponse.json({error:'取込できる行がありません'}, {status:400});
 const sb=adminClient();
 const { error } = await sb.from('daily_results').upsert(rows, { onConflict:'play_date,hall_name,unit_no' });
 if(error) return NextResponse.json({error:error.message}, {status:500});
 return NextResponse.json({ok:true, count:rows.length});
}
