import React, { useState } from 'react';
import { MainCategory } from '../types/inventory';
import { X, Plus, Package } from 'lucide-react';

const NO_TOOL_SUBCATEGORIES = [
  'EZ Stick',
  'EZ Fit',
  'EZ Grip',
  'Magnet',
  'No Tool Pleated Shades',
];

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: MainCategory[];
  onAddNewModel: (
    categoryId: string,
    subCategory: string,
    code: string,
    name: string,
    material: string,
    dimensions: string,
    initialVariantCode: string,
    initialVariantName: string,
    initialStock: number
  ) => void;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddNewModel,
}) => {
  if (!isOpen) return null;

  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'no_tool');
  const [subCategory, setSubCategory] = useState(
    categories[0]?.id === 'no_tool' ? 'EZ Stick' : ''
  );
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [material, setMaterial] = useState('');
  const [dimensions, setDimensions] = useState('W 100cm × H 180cm');
  const [variantCode, setVariantCode] = useState('');
  const [variantName, setVariantName] = useState('Standard White');
  const [initialStock, setInitialStock] = useState(50);

  const isNoTool = categoryId === 'no_tool';

  const handleCategoryChange = (newCatId: string) => {
    setCategoryId(newCatId);
    if (newCatId === 'no_tool') {
      setSubCategory('EZ Stick');
    } else {
      setSubCategory('');
    }
  };

  const handleCodeChange = (newCode: string) => {
    const upper = newCode.toUpperCase();
    setCode(upper);
    if (!variantCode || variantCode.includes('-001') || variantCode === '001') {
      setVariantCode(upper ? `${upper}-001` : '001');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    const finalModelCode = code.toUpperCase().trim();
    let finalVariantCode = variantCode.trim();
    if (!finalVariantCode) {
      finalVariantCode = `${finalModelCode}-001`;
    } else if (!finalVariantCode.startsWith(`${finalModelCode}-`)) {
      finalVariantCode = `${finalModelCode}-${finalVariantCode.replace(/^[A-Za-z]+-/, '')}`;
    }

    onAddNewModel(
      categoryId,
      subCategory.trim(),
      finalModelCode,
      name.trim(),
      material.trim() || 'Custom Composite',
      dimensions.trim(),
      finalVariantCode,
      variantName.trim(),
      initialStock
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl border border-[#dce5dc] relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 rounded-full text-[#6f877b] hover:bg-[#edf2ec] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-[#e3ece4] text-[#477a6f] flex items-center justify-center">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#2d4237]">新增產品型號與庫存規格</h3>
            <p className="text-xs text-[#71877c]">設定產品代碼 (如 BD, QK) 及首發色票規格 (如 001)</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#526a5e] mb-1">
                所屬分類
              </label>
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f4f7f3] border border-[#d6e0d5] rounded-xl focus:outline-hidden cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#526a5e] mb-1">
                次分類 / 標籤
              </label>
              {isNoTool ? (
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#f4f7f3] border border-[#d6e0d5] rounded-xl focus:outline-hidden cursor-pointer"
                >
                  {NO_TOOL_SUBCATEGORIES.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  placeholder="手動輸入次分類（可留空）"
                  className="w-full px-3 py-2 text-xs bg-[#f4f7f3] border border-[#d6e0d5] rounded-xl focus:outline-hidden"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="block text-xs font-semibold text-[#526a5e] mb-1">
                型號代碼 (例: BD)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="BD"
                maxLength={5}
                className="w-full px-3 py-2 text-xs font-bold text-[#477a6f] bg-[#f4f7f3] border border-[#d6e0d5] rounded-xl focus:outline-hidden uppercase"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-[#526a5e] mb-1">
                規格品名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如: Section A-3 (Tension Pole)"
                className="w-full px-3 py-2 text-xs bg-[#f4f7f3] border border-[#d6e0d5] rounded-xl focus:outline-hidden"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#526a5e] mb-1">
                主要材質
              </label>
              <input
                type="text"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="例如: High-grade Aluminum"
                className="w-full px-3 py-2 text-xs bg-[#f4f7f3] border border-[#d6e0d5] rounded-xl focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#526a5e] mb-1">
                預設尺寸
              </label>
              <input
                type="text"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#f4f7f3] border border-[#d6e0d5] rounded-xl focus:outline-hidden"
              />
            </div>
          </div>

          <div className="p-3 bg-[#f3f7f2] rounded-2xl border border-[#dce5dc] space-y-3">
            <span className="text-xs font-bold text-[#2d4237] block">
              初始色票規格 (SKU)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] text-[#637d70] mb-0.5">
                  色票編號 (例: {code ? `${code}-001` : 'ED-001'})
                </label>
                <input
                  type="text"
                  value={variantCode}
                  onChange={(e) => setVariantCode(e.target.value)}
                  placeholder={code ? `${code}-001` : 'ED-001'}
                  className="w-full px-2.5 py-1.5 text-xs font-bold text-[#568781] bg-white border border-[#d1ded2] rounded-lg focus:outline-hidden"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#637d70] mb-0.5">
                  顏色名稱
                </label>
                <input
                  type="text"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="White"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#d1ded2] rounded-lg focus:outline-hidden"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#637d70] mb-0.5">
                  初始庫存
                </label>
                <input
                  type="number"
                  min="0"
                  value={initialStock}
                  onChange={(e) => setInitialStock(parseInt(e.target.value) || 0)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#d1ded2] rounded-lg focus:outline-hidden"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full text-xs font-medium text-[#5c7367] hover:bg-[#edf2ec] transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full bg-[#6a917b] hover:bg-[#5b806b] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>建立並加入庫存</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
