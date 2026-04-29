'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { HallMapCell } from '@/lib/types';
import { Modal, LoadingSpinner, Alert, ConfirmDialog } from '@/components/UI';
import { Grid3x3, Save, Trash2, Plus } from 'lucide-react';

export default function MapEditPage() {
  const [hall, setHall] = useState('');
  const [rows, setRows] = useState(20);
  const [cols, setCols] = useState(30);
  const [cells, setCells] = useState<HallMapCell[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // モーダル管理
  const [editModal, setEditModal] = useState<{ cell: HallMapCell; row: number; col: number } | null>(null);
  const [unitInput, setUnitInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // マップ読み込み
  async function loadMap() {
    if (!hall) return;
    
    setLoading(true);
    const { data } = await supabase
      .from('hall_maps')
      .select('*')
      .eq('hall_name', hall)
      .eq('map_name', 'main')
      .order('row_no')
      .order('col_no');

    setCells(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (hall) loadMap();
  }, [hall]);

  // 空マップ作成
  async function createEmptyMap() {
    if (!hall.trim()) {
      setMessage({ type: 'error', text: 'ホール名を入力してください' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hall_name: hall,
          rows,
          cols,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error });
        return;
      }

      setMessage({ type: 'success', text: `${data.count}セルのマップを作成しました` });
      await loadMap();
    } catch (error) {
      setMessage({ type: 'error', text: 'マップ作成に失敗しました' });
    } finally {
      setLoading(false);
    }
  }

  // セル編集
  function openEditModal(cell: HallMapCell, row: number, col: number) {
    setEditModal({ cell, row, col });
    setUnitInput(cell.unit_no?.toString() || '');
  }

  async function saveCell() {
    if (!editModal) return;

    const unitNo = unitInput.trim() ? Number(unitInput) : null;

    // 台番号バリデーション
    if (unitInput.trim() && (isNaN(unitNo!) || unitNo! < 1 || unitNo! > 99999)) {
      setMessage({ type: 'error', text: '台番号は1〜99999の数値で入力してください' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/map', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hall_name: hall,
          map_name: 'main',
          row_no: editModal.row,
          col_no: editModal.col,
          unit_no: unitNo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: 'error', text: data.error });
        return;
      }

      await loadMap();
      setEditModal(null);
      setMessage({ type: 'success', text: '台番号を更新しました' });
    } catch (error) {
      setMessage({ type: 'error', text: '保存に失敗しました' });
    } finally {
      setLoading(false);
    }
  }

  // マップ削除
  async function deleteMap() {
    if (!hall) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('hall_maps')
        .delete()
        .eq('hall_name', hall)
        .eq('map_name', 'main');

      if (error) throw error;

      setCells([]);
      setMessage({ type: 'success', text: 'マップを削除しました' });
    } catch (error) {
      setMessage({ type: 'error', text: '削除に失敗しました' });
    } finally {
      setLoading(false);
    }
  }

  // グリッド描画
  const maxRow = Math.max(rows, ...cells.map((c) => c.row_no || 0), 1);
  const maxCol = Math.max(cols, ...cells.map((c) => c.col_no || 0), 1);
  const cellMap = new Map(cells.map((c) => [`${c.row_no}-${c.col_no}`, c]));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Grid3x3 className="text-orange-400" size={28} />
        <h1 className="text-2xl font-black md:text-3xl">ホールマップ編集</h1>
      </div>

      {/* 設定カード */}
      <div className="card p-4">
        <div className="grid gap-4 md:grid-cols-5">
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
            <label className="mb-2 block text-sm font-semibold">行数</label>
            <input
              type="number"
              className="input w-full"
              min="1"
              max="50"
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">列数</label>
            <input
              type="number"
              className="input w-full"
              min="1"
              max="50"
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={createEmptyMap}
              disabled={loading}
              className="btn flex w-full items-center justify-center gap-2"
            >
              <Plus size={18} />
              <span>空マップ作成</span>
            </button>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={loading || cells.length === 0}
              className="btn-danger flex w-full items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              <span>マップ削除</span>
            </button>
          </div>
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <Alert type={message.type}>
          <p>{message.text}</p>
        </Alert>
      )}

      {/* グリッド */}
      {cells.length > 0 ? (
        <div className="card overflow-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-neutral-400">
              セルをクリックして台番号を編集できます
            </p>
            {loading && <LoadingSpinner text="読込中..." />}
          </div>

          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: `repeat(${maxCol}, minmax(60px, 1fr))`,
              minWidth: maxCol * 62,
            }}
          >
            {Array.from({ length: maxRow * maxCol }, (_, i) => {
              const r = Math.floor(i / maxCol) + 1;
              const c = (i % maxCol) + 1;
              const cell = cellMap.get(`${r}-${c}`) || {
                row_no: r,
                col_no: c,
                hall_name: hall,
                map_name: 'main',
                unit_no: null,
              };

              return (
                <button
                  key={i}
                  onClick={() => openEditModal(cell, r, c)}
                  className={`cell ${
                    cell.unit_no
                      ? 'bg-orange-500 text-black font-bold'
                      : 'bg-neutral-900 text-neutral-600'
                  }`}
                >
                  {cell.unit_no || `${r}-${c}`}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-neutral-500">ホール名を入力して空マップを作成してください</p>
        </div>
      )}

      {/* 編集モーダル */}
      {editModal && (
        <Modal
          isOpen={!!editModal}
          onClose={() => setEditModal(null)}
          title={`セル編集 (${editModal.row}行 ${editModal.col}列)`}
        >
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold">台番号</label>
              <input
                type="text"
                className="input w-full"
                placeholder="例: 101 (空欄で削除)"
                value={unitInput}
                onChange={(e) => setUnitInput(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveCell();
                }}
              />
              <p className="mt-2 text-xs text-neutral-500">
                空欄にすると台番号を削除できます
              </p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setEditModal(null)} className="btn-sub flex-1">
                キャンセル
              </button>
              <button onClick={saveCell} className="btn flex-1 flex items-center justify-center gap-2">
                <Save size={18} />
                <span>保存</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 削除確認ダイアログ */}
      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteMap}
        title="マップ削除"
        message={`「${hall}」のマップをすべて削除しますか？この操作は取り消せません。`}
        confirmText="削除"
        danger
      />
    </div>
  );
}
