# SLOT STRATEGY WEB v1

身内用のスロット分析Webアプリ初期版です。

## 機能
- スマホ/PC対応
- HTML保存データ取込
- CSV取込
- 表貼り付け取込
- 日付別データ一覧
- ホールマップ編集
- 差枚色付きホールマップ
- 3台並びハイライト
- 機種/末尾分析
- 明日狙い目ランキング

## Supabase設定
1. Supabaseで新規Projectを作成
2. SQL Editorを開く
3. `supabase/schema.sql` の中身を全部貼り付けてRun
4. Project Settings → API から以下を取得
   - Project URL
   - anon public key
   - service_role key

## Vercel環境変数
VercelのProject Settings → Environment Variables に以下を設定。

```env
NEXT_PUBLIC_SUPABASE_URL=SupabaseのProject URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=Supabaseのanon public key
SUPABASE_SERVICE_ROLE_KEY=Supabaseのservice_role key
```

## 注意
v1は身内用のため、RLSはURLを知っている人が読み書きできる設定です。
広く公開する段階では、Googleログインとユーザー別RLSに切り替えてください。

## ローカルで確認する場合
```bash
npm install
npm run dev
```

ただし、先生はローカル環境で詰まりやすいため、基本はVercel公開運用を推奨します。
