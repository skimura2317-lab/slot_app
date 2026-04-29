import { NextResponse } from 'next/server';
import { supabase, getErrorMessage } from '@/lib/supabase';
import { parseCsv, parseHtml, parsePastedTable, validateResults } from '@/lib/parser';
import { ImportMode } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, text, play_date, hall_name } = body as {
      mode: ImportMode;
      text: string;
      play_date: string;
      hall_name: string;
    };

    // 入力チェック
    if (!play_date || !hall_name || !text) {
      return NextResponse.json(
        { error: '日付・ホール名・データがすべて必要です' },
        { status: 400 }
      );
    }

    // パース処理
    let rows;
    switch (mode) {
      case 'csv':
        rows = parseCsv(text, play_date, hall_name);
        break;
      case 'html':
        rows = parseHtml(text, play_date, hall_name);
        break;
      default:
        rows = parsePastedTable(text, play_date, hall_name);
    }

    // バリデーション
    const { valid, errors } = validateResults(rows);

    if (valid.length === 0) {
      const errorMsg = errors.length > 0 
        ? `データが不正です:\n${errors.slice(0, 5).join('\n')}`
        : '取込できるデータがありませんでした';
      
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    // Supabaseに保存（重複時は上書き）
    const { error } = await supabase
      .from('daily_results')
      .upsert(valid, {
        onConflict: 'play_date,hall_name,unit_no',
      });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      count: valid.length,
      warnings: errors.length > 0 ? errors.slice(0, 3) : undefined,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: error.message || '不明なエラーが発生しました' },
      { status: 500 }
    );
  }
}
