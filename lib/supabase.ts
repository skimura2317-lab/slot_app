import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 環境変数チェック（開発時のみ警告）
if (!supabaseUrl || !supabaseAnonKey) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Supabase環境変数が未設定です。.env.localを確認してください。');
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ヘルパー: エラーメッセージを日本語化
export function getErrorMessage(error: any): string {
  if (!error) return '不明なエラーが発生しました';
  
  const message = error.message || error.toString();
  
  // よくあるエラーを日本語化
  if (message.includes('duplicate key')) return '重複するデータが既に存在します';
  if (message.includes('violates foreign key')) return '関連データが見つかりません';
  if (message.includes('not found')) return 'データが見つかりません';
  if (message.includes('permission')) return '権限がありません';
  if (message.includes('network')) return 'ネットワークエラーが発生しました';
  
  return message;
}
