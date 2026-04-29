# スロット分析Webアプリ v2.0

パチスロ実戦データを蓄積・分析し、ホールごとの傾向・並び・狙い台を可視化するWebアプリケーション。

## 主な機能

- ✅ **データ取込**: HTML/CSV/表貼り付け対応、自動パース
- ✅ **ホールマップ**: 実配置を再現、差枚色分け、並び検出
- ✅ **分析**: 機種別・末尾別の詳細統計
- ✅ **明日狙い目**: 過去データからスコアリング、候補抽出
- ✅ **レスポンシブ**: スマホ・PC完全対応

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Supabase (PostgreSQL)
- **デプロイ**: Vercel

## セットアップ手順

### 1. Supabase プロジェクト作成

1. https://supabase.com でアカウント作成
2. 新規プロジェクトを作成
3. SQL Editorで `supabase/schema.sql` を実行
4. Project Settings > API から以下を取得:
   - `Project URL`
   - `anon public key`

### 2. Vercel デプロイ

1. GitHubにこのリポジトリをプッシュ
2. https://vercel.com で新規プロジェクト作成
3. 環境変数を設定:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
4. デプロイ実行

### 3. ローカル開発（オプション）

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local
# .env.local を編集して Supabase 情報を入力

# 開発サーバー起動
npm run dev
```

## 使い方

### 1. データ取込

1. `/upload` ページを開く
2. ホール名・日付を入力
3. データを貼り付け（HTML/CSV/表）
4. 「データを取り込む」をクリック

### 2. ホールマップ作成

1. `/map/edit` ページを開く
2. ホール名・行数・列数を入力
3. 「空マップ作成」をクリック
4. セルをクリックして台番号を入力

### 3. マップ表示

1. `/map` ページを開く
2. ホール名・日付を入力
3. 「表示」をクリック
4. 差枚色分け・並び検出結果を確認

### 4. 分析

1. `/analysis` ページで機種別・末尾別の統計を確認
2. `/tomorrow` ページで明日狙い目の候補を確認

## ディレクトリ構成

```
├── app/
│   ├── page.tsx              # トップページ
│   ├── layout.tsx            # ルートレイアウト
│   ├── globals.css           # グローバルスタイル
│   ├── upload/               # データ取込
│   ├── data/                 # データ一覧
│   ├── map/                  # マップ表示・編集
│   ├── analysis/             # 分析
│   ├── tomorrow/             # 明日狙い目
│   └── api/                  # APIルート
│       ├── import/           # データ取込API
│       └── map/              # マップ操作API
├── components/
│   ├── Nav.tsx               # ナビゲーション
│   └── UI.tsx                # 共通UIコンポーネント
├── lib/
│   ├── supabase.ts           # Supabaseクライアント
│   ├── types.ts              # 型定義
│   ├── parser.ts             # データパーサー
│   └── score.ts              # スコアリング・並び検出
└── supabase/
    └── schema.sql            # DBスキーマ
```

## 主な改善点（v2.0）

### UI/UX
- ✅ モーダルダイアログ（`prompt()` 廃止）
- ✅ ローディング表示
- ✅ エラーメッセージ改善
- ✅ レスポンシブデザイン最適化
- ✅ アニメーション追加

### 機能
- ✅ バリデーション強化
- ✅ 並び検出強化（横・縦・機種別）
- ✅ スコアリングロジック改善
- ✅ 統計情報拡充

### 開発
- ✅ TypeScript完全対応
- ✅ エラーハンドリング強化
- ✅ コード分割・最適化

## トラブルシューティング

### Vercelで404が出る

**原因**: ビルドエラーまたは環境変数未設定

**解決**:
1. Vercel Dashboard > Deployments > 最新デプロイ > Logs を確認
2. Environment Variables が正しく設定されているか確認

### データが取り込めない

**原因**: Supabase接続エラー

**解決**:
1. ブラウザのConsole (F12) でエラー確認
2. 環境変数が正しいか確認
3. Supabaseプロジェクトが稼働中か確認

### マップが表示されない

**原因**: ホール名の不一致

**解決**:
- データ取込とマップ編集で完全に同じホール名を使用

## ライセンス

MIT License

## 作者

柊登
