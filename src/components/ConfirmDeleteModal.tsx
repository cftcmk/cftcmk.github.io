import React from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  itemDescription: string;
  warningText?: string;
  isDeleting?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  itemDescription,
  warningText = '此動作將自資料庫永久刪除，且無法復原。',
  isDeleting = false,
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#f0d4d4] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#fde8e8] bg-[#fff5f5]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#fde8e8] text-[#c0392b] flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h3 className="text-sm font-bold text-[#90241b]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[#995c57] hover:text-[#90241b] hover:bg-[#fad0d0] transition-colors cursor-pointer"
            title="取消關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-3.5">
          <div className="p-3 bg-[#faf5f5] rounded-xl border border-[#f5dede]">
            <span className="text-[11px] font-semibold text-[#80403b] block mb-1">即將刪除的項目：</span>
            <p className="text-xs font-bold text-[#2d4037] break-words">{itemDescription}</p>
          </div>

          <div className="flex items-start gap-2 text-xs text-[#a33a30] bg-[#fff0f0] p-2.5 rounded-xl border border-[#ffd6d6]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#c0392b]" />
            <span className="text-[11px] leading-relaxed">{warningText}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="flex-1 py-2 px-3.5 rounded-xl bg-[#f2f4f1] hover:bg-[#e4e8e3] text-[#465c51] text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="flex-1 py-2 px-3.5 rounded-xl bg-[#c0392b] hover:bg-[#a93226] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>刪除中...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>確認刪除</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
