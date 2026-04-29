'use client';

import { useState } from 'react';
import { Upload, FileText, Table, Edit3, AlertCircle } from 'lucide-react';
import { ImportMode } from '@/lib/types';
import { LoadingSpinner, Alert } from '@/components/UI';

export default function UploadPage() {
  const [mode, setMode] = useState<ImportMode>('paste');
  const [text, setText] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [hall, setHall] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function handleSubmit() {
    if (!hall.trim()) {
      setMessage({ type: 'error', text: 'ホール名を入力してください' });
      return;
    }

    if (!text.trim()) {
      setMessage({ type: 'error', text: 'データを入力してください' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          text,
          play_date: date,
          hall_name: hall,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || '取込に失敗しました' });
        return;
      }

      setMessage({
        type: 'success',
        text: `✓ ${data.count}件のデータを取り込みました`,
      });
      
      // 成功時は入力欄をクリア
      setText('');
    } catch (error) {
      setMessage({ type: 'error', text: 'ネットワークエラーが発生しました' });
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      setText(content);

      // ファイル拡張子からモードを自動判定
      if (file.name.endsWith('.csv')) {
        setMode('csv');
      } else if (file.name.endsWith('.html') || file.name.endsWith('.htm')) {
        setMode('html');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'ファイルの読み込みに失敗しました' });
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-2xl font-black md:text-3xl">データ取込</h1>

      {/* 設定カード */}
      <div className="card p-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-2 block text-sm font-semibold">実戦日</label>
            <input
              type="date"
              className="input w-full"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">ホール名</label>
            <input
              type="text"
              className="input w-full"
              placeholder="例: マルハン新宿"
              value={hall}
              onChange={(e) => setHall(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">取込形式</label>
            <select
              className="input w-full"
              value={mode}
              onChange={(e) => setMode(e.target.value as ImportMode)}
            >
              <option value="paste">表貼り付け</option>
              <option value="csv">CSV</option>
              <option value="html">HTML</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">ファイル選択</label>
            <input
              type="file"
              className="input w-full text-sm"
              accept=".csv,.html,.htm,.txt"
              onChange={handleFileUpload}
            />
          </div>
        </div>
      </div>

      {/* 入力エリア */}
      <div className="card p-4">
        <label className="mb-2 block text-sm font-semibold">データ</label>
        <textarea
          className="input w-full font-mono text-sm"
          rows={15}
          placeholder={getPlaceholder(mode)}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        
        {/* ヘルプテキスト */}
        <div className="mt-3 flex items-start gap-2 text-xs text-neutral-500">
          <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
          <p>{getHelpText(mode)}</p>
        </div>
      </div>

      {/* 実行ボタン */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn flex items-center gap-2"
        >
          {loading ? (
            <>
              <LoadingSpinner />
              <span>取込中...</span>
            </>
          ) : (
            <>
              <Upload size={18} />
              <span>データを取り込む</span>
            </>
          )}
        </button>

        <button
          onClick={() => {
            setText('');
            setMessage(null);
          }}
          className="btn-sub"
        >
          クリア
        </button>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <Alert type={message.type}>
          <p>{message.text}</p>
        </Alert>
      )}

      {/* 使い方ガイド */}
      <div className="card p-6">
        <h2 className="mb-4 text-lg font-bold">使い方</h2>
        <div className="space-y-4">
          <GuideItem
            icon={Table}
            title="表貼り付け"
            description="データサイトの台データ表をコピーして貼り付けます。タブ区切り・スペース区切りに対応。"
          />
          <GuideItem
            icon={FileText}
            title="CSV"
            description="CSVファイルの内容を貼り付けます。ヘッダー行から自動的に列を判定します。"
          />
          <GuideItem
            icon={Edit3}
            title="HTML"
            description="スクレイピング結果のHTMLをそのまま貼り付けます。タグは自動で除去されます。"
          />
        </div>
      </div>
    </div>
  );
}

function getPlaceholder(mode: ImportMode): string {
  switch (mode) {
    case 'csv':
      return '台番号,機種,G数,差枚,BB,RB\n101,ジャグラー,5000,+1200,30,15';
    case 'html':
      return '<table><tr><td>101</td><td>ジャグラー</td>...';
    default:
      return 'ジャグラー\t101\t5000\t+1200\t30\t15\n北斗の拳\t102\t4500\t+850\t25\t10';
  }
}

function getHelpText(mode: ImportMode): string {
  switch (mode) {
    case 'csv':
      return 'CSVファイルの1行目はヘッダー行として扱われます。台番号・機種名・G数・差枚の列が必要です。';
    case 'html':
      return 'HTMLタグは自動的に除去され、表形式として解析されます。';
    default:
      return '表データをそのままコピー＆ペーストしてください。機種名・台番号・G数・差枚の順で認識されます。';
  }
}

function GuideItem({
  icon: Icon,
  title,
  description,
}: {
  icon: any;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-neutral-900 p-2 text-orange-400">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-sm text-neutral-400">{description}</p>
      </div>
    </div>
  );
}
