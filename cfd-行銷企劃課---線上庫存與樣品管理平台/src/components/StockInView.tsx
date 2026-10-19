import React, { useState } from 'react';
import { MainCategory } from '../types/inventory';
import { PackagePlus, CheckCircle2, ArrowRight } from 'lucide-react';

interface StockInViewProps {
  categories: MainCategory[];
  onStockIn: (
    modelCode: string,
    variantCode: string,
    qty: number,
    warehouse: string,
    batchNo: string
  ) => void;
}

export const StockInView: React.FC<StockInViewProps> = ({ categories, onStockIn }) => {
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || 'no_tool');
  const currentCat = categories.find((c) => c.id === selectedCatId) || categories[0];
  const [selectedModelCode, setSelectedModelCode] = useState(currentCat.models[0]?.code || '');
  const currentModel = currentCat.models.find((m) => m.code === selectedModelCode) || currentCat.models[0];
  const [selectedVariantCode, setSelectedVariantCode] = useState(currentModel?.variants[0]?.code || '001');

  const [quantity, setQuantity] = useState<number>(50);
  const [warehouse, setWarehouse] = useState<string>('北區總倉');
  const [batchNo, setBatchNo] = useState<string>('BATCH-202610-01');
  const [notes, setNotes] = useState<string>('定期批量生產驗收');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0) return;
    onStockIn(selectedModelCode, selectedVariantCode, quantity, warehouse, batchNo);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e2e9e1]">
      <div className="flex items-center justify-between pb-4 border-b border-[#edf2ec] mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#2d4237] flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-[#5e8473]" />
            商品入庫登記作業
          </h2>
          <p className="text-xs text-[#6e8478] mt-1">
            依照產品編號與規格批次建立進貨入庫單，即時提升各分倉儲備水位。
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#f1f6f1] text-[#4d6a5c] border border-[#d9e4db]">
          單據狀態: 待審核過帳
        </span>
      </div>

      {submitted && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            入庫成功！規格 <strong>{selectedModelCode}-{selectedVariantCode}</strong> 已完成過帳入庫 <strong>+{quantity}</strong> 件。
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Product Selection */}
        <div className="bg-[#f4f7f3] p-5 rounded-2xl border border-[#e5ebe3] space-y-4">
          <h3 className="text-sm font-bold text-[#2c3e35] pb-2 border-b border-[#e5ece4]">
            1. 選擇入庫品項規格
          </h3>

          <div>
            <label className="block text-xs font-medium text-[#5c7267] mb-1.5">
              主要產品大類
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => {
                    setSelectedCatId(c.id);
                    setSelectedModelCode(c.models[0]?.code || '');
                    setSelectedVariantCode(c.models[0]?.variants[0]?.code || '001');
                  }}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl text-center transition-all ${
                    c.id === selectedCatId
                      ? 'bg-[#7f9c8e] text-white shadow-xs'
                      : 'bg-white text-[#3f564a] hover:bg-[#eef4ee]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5c7267] mb-1.5">
              產品型號編號
            </label>
            <div className="grid grid-cols-2 gap-2">
              {currentCat.models.map((m) => (
                <button
                  type="button"
                  key={m.code}
                  onClick={() => {
                    setSelectedModelCode(m.code);
                    setSelectedVariantCode(m.variants[0]?.code || '001');
                  }}
                  className={`p-2.5 text-xs text-left rounded-xl transition-all flex items-center justify-between ${
                    m.code === selectedModelCode
                      ? 'bg-white ring-2 ring-[#7f9c8e] shadow-xs'
                      : 'bg-white/80 hover:bg-white text-[#3f564a]'
                  }`}
                >
                  <span className="font-extrabold text-[#477a6f]">{m.code}</span>
                  <span className="truncate text-[11px] text-[#60766a] ml-2">
                    {m.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#5c7267] mb-1.5">
              色票編號規格 (SKU)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {currentModel?.variants.map((v) => (
                <button
                  type="button"
                  key={v.code}
                  onClick={() => setSelectedVariantCode(v.code)}
                  className={`p-2 text-xs rounded-xl flex items-center gap-2 transition-all ${
                    v.code === selectedVariantCode
                      ? 'bg-white ring-2 ring-[#de5e2b] shadow-xs'
                      : 'bg-white/80 hover:bg-white text-[#3f564a]'
                  }`}
                >
                  <span className="font-bold text-[#de5e2b]">{v.code}</span>
                  <span className="truncate text-[11px] font-medium text-[#2d4237]">
                    {v.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Quantity, Batch, Target Warehouse */}
        <div className="bg-[#f4f7f3] p-5 rounded-2xl border border-[#e5ebe3] flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#2c3e35] pb-2 border-b border-[#e5ece4]">
              2. 入庫數量與倉位指定
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5c7267] mb-1">
                  入庫數量 (件)
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white text-[#2c3e35] font-semibold text-sm rounded-xl border border-[#d6e0d5] focus:outline-hidden focus:border-[#7f9c8e]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5c7267] mb-1">
                  目標入庫倉庫
                </label>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-[#2c3e35] text-xs font-medium rounded-xl border border-[#d6e0d5] focus:outline-hidden focus:border-[#7f9c8e]"
                >
                  <option value="北區總倉">北區總倉 (W1)</option>
                  <option value="桃竹分倉">桃竹分倉 (W2)</option>
                  <option value="中部樞紐">中部樞紐 (W3)</option>
                  <option value="南部中心">南部中心 (W4)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5c7267] mb-1">
                生產或採購批號
              </label>
              <input
                type="text"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                className="w-full px-3 py-2 bg-white text-[#2c3e35] text-xs rounded-xl border border-[#d6e0d5] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5c7267] mb-1">
                備註說明
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例如: 港口清關到貨、換季追加..."
                className="w-full px-3 py-2 bg-white text-[#2c3e35] text-xs rounded-xl border border-[#d6e0d5] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-5 border-t border-[#e2e9e1] mt-6 flex justify-end">
            <button
              type="submit"
              className="px-8 py-2.5 rounded-full bg-[#7f9c8e] hover:bg-[#6c8a7c] text-white text-xs md:text-sm font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <span>確認過帳入庫</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
