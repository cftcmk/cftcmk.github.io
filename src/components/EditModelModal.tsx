import React, { useState, useEffect } from 'react';
import { ProductModel } from '../types/inventory';
import { X, Check, FileEdit, AlertCircle } from 'lucide-react';

interface EditModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ProductModel | null;
  onSaveModel: (
    modelCode: string,
    data: {
      productName: string;
      material: string;
      dimensions: string;
      description: string;
      expectedUpdatedAt?: string;
    }
  ) => Promise<void>;
}

export const EditModelModal: React.FC<EditModelModalProps> = ({
  isOpen,
  onClose,
  model,
  onSaveModel,
}) => {
  const [productName, setProductName] = useState('');
  const [material, setMaterial] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (model) {
      setProductName(model.name || '');
      setMaterial(model.material || '');
      setDimensions(model.dimensions || '');
      setDescription(model.description || '');
      setErrorMsg('');
    }
  }, [model, isOpen]);

  if (!isOpen || !model) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      setErrorMsg('型號品名不可為空');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSaveModel(model.id || model.code, {
        productName: productName.trim(),
        material: material.trim(),
        dimensions: dimensions.trim(),
        description: description.trim(),
        expectedUpdatedAt: model.updatedAt,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || '儲存規格失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl border border-[#dce5dc] relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#6f877b] hover:bg-[#edf2ec] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#eff5ef] text-[#4e7966] flex items-center justify-center border border-[#d2e4d4]">
            <FileEdit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#2d4237]">編輯產品型號規格 (Database Update)</h3>
            <p className="text-xs text-[#71877c] mt-0.5">
              型號代碼: <strong className="font-mono text-[#7da8a3]">{model.code}</strong> · 系列: {model.subCategory || 'Standard'}
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#fdf2f0] border border-[#f5c6cb] text-[#c0392b] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#526a5e] mb-1">
              型號品名 (Product Name) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#f4f7f3] text-xs font-semibold text-[#2d4237] border border-[#d6e0d5] rounded-xl focus:outline-hidden focus:border-[#4e7966]"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-[#526a5e] mb-1">
              標準尺寸 (Dimensions)
            </label>
            <input
              type="text"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              placeholder='例如：W: 36" × H: 72"'
              className="w-full px-3 py-2 bg-[#f4f7f3] text-xs text-[#2d4237] border border-[#d6e0d5] rounded-xl focus:outline-hidden focus:border-[#4e7966]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#526a5e] mb-1">
              材質工藝 (Material)
            </label>
            <input
              type="text"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              placeholder="例如：鋁合金 / 阻燃遮光聚酯纖維"
              className="w-full px-3 py-2 bg-[#f4f7f3] text-xs text-[#2d4237] border border-[#d6e0d5] rounded-xl focus:outline-hidden focus:border-[#4e7966]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#526a5e] mb-1">
              產品描述 (Description)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#f4f7f3] text-xs text-[#2d4237] border border-[#d6e0d5] rounded-xl focus:outline-hidden focus:border-[#4e7966]"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#587365] bg-[#edf2ec] hover:bg-[#e1e9e0] transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#547a6b] hover:bg-[#466659] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSubmitting ? '儲存中...' : '確認更新規格'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
