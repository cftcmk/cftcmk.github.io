import React, { useState } from 'react';
import { ProductModel, VariantSKU, BorrowRecord } from '../types/inventory';
import { X, Database, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DocCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ProductModel | null;
  variant: VariantSKU | null;
  borrows?: BorrowRecord[];
}

export const DocCardModal: React.FC<DocCardModalProps> = ({
  isOpen,
  onClose,
  model,
  variant,
  borrows = [],
}) => {
  const [viewMode, setViewMode] = useState<'card' | 'database'>('card');

  if (!isOpen || !model || !variant) return null;

  // Determine borrow status
  const activeBorrow = borrows.find(
    (b) => b.skuCode === variant.code && b.status === '借用中'
  );
  const isBorrowed = variant.reserved > 0 || !!activeBorrow;
  const borrowedQty = variant.reserved > 0 ? variant.reserved : (activeBorrow?.quantity || 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 md:p-7 shadow-xl border border-[#dce5dc] relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Close X Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#6f877b] hover:bg-[#edf2ec] transition-colors cursor-pointer"
          title="關閉"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-4 pr-8">
          <span className="text-3xl font-black text-[#7da8a3] tracking-tight">{model.code}</span>
          <div>
            <h3 className="text-base font-bold text-[#2d4237] leading-snug">{model.name}</h3>
            <p className="text-xs text-[#71877c] mt-0.5">
              規格色票: <strong className="text-[#e25b24] font-bold">{variant.code}</strong> {variant.name}
            </p>
          </div>
        </div>

        {/* Tab switch: 簡約展示卡 vs 正式資料庫規格 */}
        <div className="flex bg-[#eff4ef] p-1 rounded-xl mb-4 border border-[#deeadf] text-xs">
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'card'
                ? 'bg-white text-[#2d4237] shadow-xs'
                : 'text-[#627d70] hover:text-[#2d4237]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>企劃展示規格卡</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('database')}
            className={`flex-1 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'database'
                ? 'bg-white text-[#2d4237] shadow-xs'
                : 'text-[#627d70] hover:text-[#2d4237]'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#547a6b]" />
            <span>正式資料庫 Schema 規格</span>
          </button>
        </div>

        {viewMode === 'card' ? (
          /* Simplified 4 Fields: 系列分類、標準尺寸、產品編號、借用狀況 */
          <div className="p-4.5 bg-[#eff3ee] rounded-2xl space-y-3.5 text-xs border border-[#e2e9e0]">
            {/* 1. 系列分類 */}
            <div className="flex items-center justify-between text-[#445b50]">
              <span className="font-semibold text-[#5d7369]">系列分類</span>
              <span className="font-medium text-[#2d4237]">{model.subCategory || 'Standard'}</span>
            </div>

            <div className="border-t border-[#e2e8e0]/60" />

            {/* 2. 標準尺寸 */}
            <div className="flex items-center justify-between text-[#445b50]">
              <span className="font-semibold text-[#5d7369]">標準尺寸</span>
              <span className="font-medium text-[#2d4237]">{model.dimensions}</span>
            </div>

            <div className="border-t border-[#e2e8e0]/60" />

            {/* 3. 產品編號 */}
            <div className="flex items-center justify-between text-[#445b50]">
              <span className="font-semibold text-[#5d7369]">產品編號</span>
              <span className="font-bold font-mono text-[#e25b24] text-sm">{variant.code}</span>
            </div>

            <div className="border-t border-[#e2e8e0]/60" />

            {/* 4. 借用狀況 */}
            <div className="flex items-center justify-between text-[#445b50]">
              <span className="font-semibold text-[#5d7369]">借用狀況</span>
              {isBorrowed ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] text-[#92400e] text-xs font-semibold border border-[#fde68a]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" />
                  <span>借用中 ({borrowedQty} 件{activeBorrow ? ` · ${activeBorrow.borrower.split(' ')[0]}` : ''})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f5e9] text-[#2e7d32] text-xs font-semibold border border-[#c8e6c9]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4caf50]" />
                  <span>可借用 (在庫 {variant.totalStock} 件)</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Full Production Database Schema View (All Required DB Fields) */
          <div className="p-4 bg-[#f6f9f6] rounded-2xl border border-[#dde7dd] space-y-2.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#e5ede5]">
              <span className="font-mono text-[11px] text-[#486b59] font-bold">TABLE: products & product_variants</span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[#e0eee2] text-[#2c5b3e]">ACID WAL</span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px]">
              <div>
                <span className="text-[#71877c] block text-[10px]">Product ID (唯一識別碼)</span>
                <span className="font-mono font-semibold text-[#2d4237]">{model.id || `prod-${model.code.toLowerCase()}`}</span>
              </div>
              <div>
                <span className="text-[#71877c] block text-[10px]">Product Code (型號代碼)</span>
                <span className="font-mono font-bold text-[#e25b24]">{model.code}</span>
              </div>

              <div>
                <span className="text-[#71877c] block text-[10px]">Product Name (品項名稱)</span>
                <span className="font-semibold text-[#2d4237]">{model.name}</span>
              </div>
              <div>
                <span className="text-[#71877c] block text-[10px]">Category (大分類)</span>
                <span className="font-medium text-[#2d4237]">{model.categoryName || 'No Tool'}</span>
              </div>

              <div>
                <span className="text-[#71877c] block text-[10px]">Subcategory (次系列)</span>
                <span className="font-medium text-[#2d4237]">{model.subCategory || 'Standard'}</span>
              </div>
              <div>
                <span className="text-[#71877c] block text-[10px]">IM / OM (內部/對外)</span>
                <span className="font-mono font-semibold text-[#2d4237]">{model.imOm || 'OM'}</span>
              </div>

              <div>
                <span className="text-[#71877c] block text-[10px]">Size (標準尺寸)</span>
                <span className="font-mono text-[#2d4237]">{model.dimensions}</span>
              </div>
              <div>
                <span className="text-[#71877c] block text-[10px]">Color (規格色票)</span>
                <span className="font-semibold text-[#2d4237]">{variant.name} ({variant.code})</span>
              </div>

              <div>
                <span className="text-[#71877c] block text-[10px]">Quantity (總在庫 / 借出預留)</span>
                <span className="font-mono font-bold text-[#2d4237]">
                  {variant.totalStock} 件 (借出中: {variant.reserved} 件)
                </span>
              </div>
              <div>
                <span className="text-[#71877c] block text-[10px]">Product Status (狀態)</span>
                <span className="font-semibold text-emerald-700">{model.productStatus || 'optimal (在庫充裕)'}</span>
              </div>

              <div className="col-span-2">
                <span className="text-[#71877c] block text-[10px]">Description (產品描述)</span>
                <span className="text-[#2d4237]">{model.description || 'CFD 行銷企劃展示專用標準樣品'}</span>
              </div>

              <div className="col-span-2">
                <span className="text-[#71877c] block text-[10px]">Image (實拍照片狀態)</span>
                <span className="font-mono text-[#2d4237]">
                  {variant.customImage ? '已上傳自訂實拍圖檔 (Storage Active)' : '標準向量展示圖檔 (Default Asset)'}
                </span>
              </div>

              <div>
                <span className="text-[#71877c] block text-[10px]">Created At</span>
                <span className="font-mono text-[10px] text-[#556e60]">{model.createdAt ? model.createdAt.slice(0, 19).replace('T', ' ') : '2026-01-01 09:00:00'}</span>
              </div>
              <div>
                <span className="text-[#71877c] block text-[10px]">Updated At</span>
                <span className="font-mono text-[10px] text-[#556e60]">{model.updatedAt ? model.updatedAt.slice(0, 19).replace('T', ' ') : new Date().toISOString().slice(0, 19).replace('T', ' ')}</span>
              </div>

              <div>
                <span className="text-[#71877c] block text-[10px]">Created By</span>
                <span className="text-[#556e60] font-semibold">{model.createdBy || 'Paul Wang'}</span>
              </div>
              <div>
                <span className="text-[#71877c] block text-[10px]">Updated By</span>
                <span className="text-[#556e60] font-semibold">{model.updatedBy || 'Paul Wang'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-7 py-2 rounded-full bg-[#93b7b2] hover:bg-[#82a8a3] text-white text-xs font-semibold transition-all duration-200 shadow-2xs cursor-pointer active:scale-95"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
