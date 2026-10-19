import React, { useState, useEffect, useMemo } from 'react';
import { ProductModel, VariantSKU, MainCategory } from '../types/inventory';
import { X, Calendar, Check, Send, Package, User, Building2, Tag, Info } from 'lucide-react';

interface BorrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ProductModel | null;
  variant: VariantSKU | null;
  categories?: MainCategory[];
  onSubmitBorrow: (
    categoryId: string,
    categoryName: string,
    subCategory: string,
    modelCode: string,
    modelName: string,
    skuCode: string,
    variantName: string,
    borrower: string,
    department: string,
    quantity: number,
    purpose: '行銷展演' | '客戶展示' | '設計打樣' | '新品發布拍攝' | string,
    returnDate: string,
    notes?: string
  ) => void;
}

export const BorrowModal: React.FC<BorrowModalProps> = ({
  isOpen,
  onClose,
  model,
  variant,
  categories = [],
  onSubmitBorrow,
}) => {
  // Flatten all models & variants for fallback selection
  const allModels = useMemo(() => {
    return categories.flatMap((c) => c.models);
  }, [categories]);

  const [selectedModelCode, setSelectedModelCode] = useState<string>('');
  const [selectedVariantCode, setSelectedVariantCode] = useState<string>('');

  useEffect(() => {
    if (model) {
      setSelectedModelCode(model.code);
    } else if (allModels.length > 0 && !selectedModelCode) {
      setSelectedModelCode(allModels[0].code);
    }
  }, [model, allModels, selectedModelCode]);

  const activeModel = useMemo(() => {
    if (model && model.code === selectedModelCode) return model;
    return allModels.find((m) => m.code === selectedModelCode) || allModels[0] || null;
  }, [model, selectedModelCode, allModels]);

  useEffect(() => {
    if (variant) {
      setSelectedVariantCode(variant.code);
    } else if (activeModel && activeModel.variants.length > 0) {
      setSelectedVariantCode(activeModel.variants[0].code);
    }
  }, [variant, activeModel]);

  const activeVariant = useMemo(() => {
    if (variant && variant.code === selectedVariantCode) return variant;
    return (
      activeModel?.variants.find((v) => v.code === selectedVariantCode) ||
      activeModel?.variants[0] ||
      null
    );
  }, [variant, selectedVariantCode, activeModel]);

  // Find the category of the active model for categorization
  const activeCategory = useMemo(() => {
    if (!activeModel) return null;
    return categories.find((cat) => cat.models.some((m) => m.code === activeModel.code)) || null;
  }, [activeModel, categories]);

  // Form fields
  const [borrower, setBorrower] = useState('');
  const [department, setDepartment] = useState('行銷企劃部');
  const [quantity, setQuantity] = useState(1);
  const [purpose, setPurpose] = useState<'行銷展演' | '客戶展示' | '設計打樣' | '新品發布拍攝'>(
    '新品發布拍攝'
  );

  // Set default return date to 7 days from now
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrower.trim() || !activeModel || !activeVariant) return;

    onSubmitBorrow(
      activeCategory?.id || 'no_tool',
      activeCategory?.name || 'No Tool 無痕黏貼系列',
      activeModel.subCategory || '',
      activeModel.code,
      activeModel.name,
      activeVariant.code,
      activeVariant.name,
      borrower.trim(),
      department,
      Math.max(1, quantity),
      purpose,
      returnDate,
      notes.trim()
    );
    onClose();
  };

  const maxAvailable = activeVariant ? Math.max(1, activeVariant.totalStock) : 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/45 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#dce5dc] relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#6f877b] hover:bg-[#edf2ec] transition-colors cursor-pointer"
          title="關閉"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-[#edf2ec]">
          <div className="w-11 h-11 rounded-2xl bg-[#eff3ee] text-[#547a6b] flex items-center justify-center shadow-2xs border border-[#dce5dc]">
            <Package className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#2d4237]">企劃樣品借調申請單</h3>
            <p className="text-xs text-[#71877c] mt-0.5">
              填寫借調資料後將即時登記，並同步記錄於「租借狀況」介面以利追蹤。
            </p>
          </div>
        </div>

        {/* Target Item Display or Dropdown Selection */}
        <div className="p-3.5 bg-[#eff3ee] rounded-2xl mb-4.5 border border-[#dfe7de] text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-[#354f42] flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#547a6b]" />
              <span>借用樣品項目與規格</span>
            </span>
            {activeVariant && (
              <span className="text-[11px] text-[#5f796c] font-medium">
                在席庫存：<strong className="text-[#2d4237]">{activeVariant.totalStock}</strong> 件
                （已預扣 {activeVariant.reserved} 件）
              </span>
            )}
          </div>

          {model && variant ? (
            /* Opened from specific item view */
            <div className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-[#d6e0d5]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[#edf3ed] font-extrabold text-[#547a6b] font-mono">
                  {model.code}
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-[#fbebe4] font-bold text-[#e25b24] font-mono">
                  {variant.code}
                </span>
                <span className="text-[#2d4237] font-semibold">{model.name}</span>
              </div>
              <span className="text-[11px] text-[#556961] font-medium bg-[#f6faf5] px-2 py-0.5 rounded">
                {variant.name}
              </span>
            </div>
          ) : (
            /* Opened from Quick Borrow header button -> allow picking */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#547062] mb-1">
                  選擇產品型號 (依分類呈現)
                </label>
                <select
                  value={selectedModelCode}
                  onChange={(e) => {
                    setSelectedModelCode(e.target.value);
                    const m = allModels.find((mod) => mod.code === e.target.value);
                    if (m && m.variants.length > 0) {
                      setSelectedVariantCode(m.variants[0].code);
                    }
                  }}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#d6e0d5] rounded-xl text-xs text-[#2d4237] focus:outline-hidden"
                >
                  {categories.map((cat) => (
                    <optgroup key={cat.id} label={`【分類：${cat.name}】`}>
                      {cat.models.map((m) => (
                        <option key={m.code} value={m.code}>
                          {m.code} - {m.name} {m.subCategory ? `[${m.subCategory}]` : ''}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#547062] mb-1">
                  選擇顏色 / 規格 SKU
                </label>
                <select
                  value={selectedVariantCode}
                  onChange={(e) => setSelectedVariantCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-[#d6e0d5] rounded-xl text-xs text-[#2d4237] focus:outline-hidden"
                >
                  {activeModel?.variants.map((v) => (
                    <option key={v.code} value={v.code}>
                      {v.code} ({v.name}) - 庫存 {v.totalStock}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#486255] mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#547a6b]" />
                <span>借用人姓名</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={borrower}
                onChange={(e) => setBorrower(e.target.value)}
                placeholder="例如: 王小明"
                className="w-full px-3 py-2 bg-white border border-[#d6e0d5] rounded-xl text-[#2d4237] focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#486255] mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#547a6b]" />
                <span>申請部門 / 單位</span>
                <span className="text-red-500">*</span>
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#d6e0d5] rounded-xl text-[#2d4237] focus:outline-hidden"
              >
                <option value="行銷企劃部">行銷企劃部</option>
                <option value="通路業務部">通路業務部</option>
                <option value="陳列設計部">陳列設計部</option>
                <option value="專案工程課">專案工程課</option>
                <option value="電商運營課">電商運營課</option>
                <option value="海外事業部">海外事業部</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#486255] mb-1">
                借調數量 (件/支)
                <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={maxAvailable}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-white border border-[#d6e0d5] rounded-xl text-[#2d4237] focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-[#486255] mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#547a6b]" />
                <span>預計歸還日期</span>
                <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#d6e0d5] rounded-xl text-[#2d4237] focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#486255] mb-1.5">
              借調用途分類
              <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['新品發布拍攝', '行銷展演', '客戶展示', '設計打樣'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPurpose(p)}
                  className={`py-2 px-2 rounded-xl text-center font-medium transition-all cursor-pointer ${
                    purpose === p
                      ? 'bg-[#547a6b] text-white shadow-2xs font-semibold'
                      : 'bg-[#f4f7f3] text-[#4d665b] hover:bg-[#e8eee7]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#486255] mb-1">
              用途說明與備註 (選填)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="例如: 台北旗艦門市櫥窗情境展示借用"
              className="w-full px-3 py-2 bg-white border border-[#d6e0d5] rounded-xl text-[#2d4237] focus:outline-hidden"
            />
          </div>

          <div className="p-3 rounded-xl bg-[#f8faf7] border border-[#e2eae1] text-[11px] text-[#5f786b] flex items-center gap-2">
            <Info className="w-4 h-4 text-[#547a6b] shrink-0" />
            <span>提交後系統將在「租借狀況」中生成登記單號，並預扣在庫數量。</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#5c7367] hover:bg-[#edf2ec] transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>送出借用登記單</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
