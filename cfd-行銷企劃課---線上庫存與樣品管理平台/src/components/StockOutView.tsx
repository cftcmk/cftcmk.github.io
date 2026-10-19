import React, { useState } from 'react';
import { MainCategory } from '../types/inventory';
import { PackageMinus, CheckCircle2, ArrowRight } from 'lucide-react';

interface StockOutViewProps {
  categories: MainCategory[];
  onStockOut: (
    modelCode: string,
    variantCode: string,
    qty: number,
    warehouse: string,
    orderNo: string,
    destination: string
  ) => void;
}

export const StockOutView: React.FC<StockOutViewProps> = ({ categories, onStockOut }) => {
  const [selectedCatId, setSelectedCatId] = useState(categories[0]?.id || 'no_tool');
  const currentCat = categories.find((c) => c.id === selectedCatId) || categories[0];
  const [selectedModelCode, setSelectedModelCode] = useState(currentCat.models[0]?.code || '');
  const currentModel = currentCat.models.find((m) => m.code === selectedModelCode) || currentCat.models[0];
  const [selectedVariantCode, setSelectedVariantCode] = useState(currentModel?.variants[0]?.code || '001');

  const currentVariant = currentModel?.variants.find((v) => v.code === selectedVariantCode) || currentModel?.variants[0];

  const [quantity, setQuantity] = useState<number>(5);
  const [warehouse, setWarehouse] = useState<string>('北區總倉');
  const [orderNo, setOrderNo] = useState<string>('ORD-202610-8842');
  const [destination, setDestination] = useState<string>('信義區新光商辦工程專案');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVariant) return;
    if (quantity <= 0) {
      setErrorMsg('請輸入大於0的有效出庫數量');
      return;
    }
    if (quantity > currentVariant.totalStock) {
      setErrorMsg(`出庫量超出在庫現有量 (目前總在庫 ${currentVariant.totalStock} 件)`);
      return;
    }

    setErrorMsg('');
    onStockOut(selectedModelCode, selectedVariantCode, quantity, warehouse, orderNo, destination);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="w-full bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-[#e2e9e1]">
      <div className="flex items-center justify-between pb-4 border-b border-[#edf2ec] mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#2d4237] flex items-center gap-2">
            <PackageMinus className="w-5 h-5 text-[#de5e2b]" />
            商品出庫與出貨調撥
          </h2>
          <p className="text-xs text-[#6e8478] mt-1">
            針對訂單發貨、工程案交貨或跨分倉轉移，即時扣減實際庫存。
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#fff4ee] text-[#c04b1e] border border-[#f5d4c6]">
          出庫作業程序
        </span>
      </div>

      {submitted && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs md:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            出庫完成！規格 <strong>{selectedModelCode}-{selectedVariantCode}</strong> 已核銷出庫 <strong>-{quantity}</strong> 件，訂單編號: {orderNo}。
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs md:text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side: Product Selection */}
        <div className="bg-[#f4f7f3] p-5 rounded-2xl border border-[#e5ebe3] space-y-4">
          <h3 className="text-sm font-bold text-[#2c3e35] pb-2 border-b border-[#e5ece4]">
            1. 挑選出庫品項規格
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
                  className={`p-2 text-xs rounded-xl flex items-center justify-between transition-all ${
                    v.code === selectedVariantCode
                      ? 'bg-white ring-2 ring-[#de5e2b] shadow-xs'
                      : 'bg-white/80 hover:bg-white text-[#3f564a]'
                  }`}
                >
                  <span className="font-bold text-[#de5e2b]">{v.code}</span>
                  <span className="text-[11px] font-semibold text-[#2c3e35]">
                    庫存:{v.totalStock}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Quantity, Customer / Project */}
        <div className="bg-[#f4f7f3] p-5 rounded-2xl border border-[#e5ebe3] flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#2c3e35] pb-2 border-b border-[#e5ece4]">
              2. 出庫數量與送達目標
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#5c7267] mb-1">
                  出庫扣減數量 (件)
                </label>
                <input
                  type="number"
                  min="1"
                  max={currentVariant?.totalStock || 999}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-white text-[#2c3e35] font-semibold text-sm rounded-xl border border-[#d6e0d5] focus:outline-hidden focus:border-[#7f9c8e]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5c7267] mb-1">
                  揀貨庫位
                </label>
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className="w-full px-3 py-2 bg-white text-[#2c3e35] text-xs font-medium rounded-xl border border-[#d6e0d5] focus:outline-hidden"
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
                出貨單號 / 銷貨訂單
              </label>
              <input
                type="text"
                value={orderNo}
                onChange={(e) => setOrderNo(e.target.value)}
                className="w-full px-3 py-2 bg-white text-[#2c3e35] text-xs rounded-xl border border-[#d6e0d5] focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#5c7267] mb-1">
                客戶專案 / 配送目的地
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="例如: 門市展示、工程承包商收件..."
                className="w-full px-3 py-2 bg-white text-[#2c3e35] text-xs rounded-xl border border-[#d6e0d5] focus:outline-hidden"
              />
            </div>
          </div>

          <div className="pt-5 border-t border-[#e2e9e1] mt-6 flex justify-end">
            <button
              type="submit"
              className="px-8 py-2.5 rounded-full bg-[#de5e2b] hover:bg-[#c94f1f] text-white text-xs md:text-sm font-semibold transition-all shadow-xs cursor-pointer flex items-center gap-2"
            >
              <span>核銷出庫</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
