import React, { useState, useEffect } from 'react';
import { ProductModel, VariantSKU } from '../types/inventory';
import { X, Check } from 'lucide-react';

interface EditStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ProductModel | null;
  variant: VariantSKU | null;
  onSaveStock: (
    modelCode: string,
    variantCode: string,
    newTotal: number,
    locationBin: string,
    reason: string
  ) => void;
}

export const EditStockModal: React.FC<EditStockModalProps> = ({
  isOpen,
  onClose,
  model,
  variant,
  onSaveStock,
}) => {
  const [totalStock, setTotalStock] = useState<number>(variant?.totalStock ?? 1);
  const [locationBin, setLocationBin] = useState<string>(variant?.locationBin ?? '');
  const [reason, setReason] = useState<string>('年度企劃樣品例行盤點更新');

  useEffect(() => {
    if (variant && isOpen) {
      setTotalStock(variant.totalStock);
      setLocationBin(variant.locationBin || '');
      setReason('年度企劃樣品例行盤點更新');
    }
  }, [variant, isOpen]);

  if (!isOpen || !model || !variant) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveStock(model.code, variant.code, totalStock, locationBin, reason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-xl border border-[#dce5dc] relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#6f877b] hover:bg-[#edf2ec] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-4">
          <h3 className="text-base font-bold text-[#2d4237]">
            快速編輯庫存與倉位備註
          </h3>
          <p className="text-xs text-[#71877c] mt-0.5">
            規格: <strong className="text-[#7da8a3]">{model.code}</strong> - <strong className="text-[#e25b24]">{variant.code}</strong> ({variant.name})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#526a5e] mb-1">
              現實在席庫存量 (件)
            </label>
            <input
              type="number"
              min="0"
              value={totalStock}
              onChange={(e) => setTotalStock(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-[#f4f7f3] text-sm font-bold text-[#2d4237] border border-[#d6e0d5] rounded-xl focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-[#526a5e] mb-1">
              存放倉位編號 (Bin)
            </label>
            <input
              type="text"
              value={locationBin}
              onChange={(e) => setLocationBin(e.target.value)}
              className="w-full px-3 py-2 bg-[#f4f7f3] font-mono text-xs text-[#2d4237] border border-[#d6e0d5] rounded-xl focus:outline-hidden"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-[#526a5e] mb-1">
              異動原因說明
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 bg-[#f4f7f3] text-xs text-[#2d4237] border border-[#d6e0d5] rounded-xl focus:outline-hidden"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-full text-xs font-medium text-[#5c7367] hover:bg-[#edf2ec] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-1.5 rounded-full bg-[#93b7b2] hover:bg-[#82a8a3] text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>儲存更新</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
