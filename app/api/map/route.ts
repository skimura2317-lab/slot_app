import { NextResponse } from 'next/server';
import { supabase, getErrorMessage } from '@/lib/supabase';

/**
 * POST: 空マップ作成
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { hall_name, rows, cols, map_name = 'main' } = body;

    if (!hall_name || !rows || !cols) {
      return NextResponse.json(
        { error: 'ホール名・行数・列数が必要です' },
        { status: 400 }
      );
    }

    // グリッドセル生成
    const cells = [];
    for (let r = 1; r <= Number(rows); r++) {
      for (let c = 1; c <= Number(cols); c++) {
        cells.push({
          hall_name,
          map_name,
          row_no: r,
          col_no: c,
          unit_no: null,
        });
      }
    }

    // Upsert（既存があれば上書き）
    const { error } = await supabase
      .from('hall_maps')
      .upsert(cells, {
        onConflict: 'hall_name,map_name,row_no,col_no',
      });

    if (error) {
      console.error('Map creation error:', error);
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, count: cells.length });
  } catch (error: any) {
    console.error('Map POST error:', error);
    return NextResponse.json(
      { error: error.message || '不明なエラー' },
      { status: 500 }
    );
  }
}

/**
 * PATCH: セル更新
 */
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { hall_name, map_name = 'main', row_no, col_no, unit_no } = body;

    if (!hall_name || !row_no || !col_no) {
      return NextResponse.json(
        { error: 'ホール名・行・列が必要です' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('hall_maps')
      .upsert(
        {
          hall_name,
          map_name,
          row_no: Number(row_no),
          col_no: Number(col_no),
          unit_no: unit_no ? Number(unit_no) : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'hall_name,map_name,row_no,col_no' }
      );

    if (error) {
      console.error('Cell update error:', error);
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Map PATCH error:', error);
    return NextResponse.json(
      { error: error.message || '不明なエラー' },
      { status: 500 }
    );
  }
}
