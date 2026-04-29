'use client';

import { ReactNode } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * モーダルダイアログ
 */
export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-700 bg-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 p-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-neutral-800"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

/**
 * ローディングスピナー
 */
export function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 text-orange-400">
      <Loader2 className="animate-spin" size={20} />
      {text && <span>{text}</span>}
    </div>
  );
}

/**
 * 通知メッセージ
 */
export function Alert({
  type,
  children,
}: {
  type: 'success' | 'error' | 'info';
  children: ReactNode;
}) {
  const styles = {
    success: 'bg-emerald-950 border-emerald-700 text-emerald-200',
    error: 'bg-red-950 border-red-700 text-red-200',
    info: 'bg-blue-950 border-blue-700 text-blue-200',
  };

  const Icon = type === 'success' ? CheckCircle2 : AlertCircle;

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${styles[type]}`}>
      <Icon size={20} className="mt-0.5 flex-shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
}

/**
 * 確認ダイアログ
 */
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = '実行',
  cancelText = 'キャンセル',
  danger = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="mb-6 text-neutral-300">{message}</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-sub flex-1">
          {cancelText}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`flex-1 ${danger ? 'btn-danger' : 'btn'}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

/**
 * 空状態表示
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: any;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon size={48} className="mb-4 text-neutral-600" />
      <h3 className="mb-2 text-lg font-bold text-neutral-400">{title}</h3>
      <p className="mb-6 text-sm text-neutral-500">{description}</p>
      {action}
    </div>
  );
}
