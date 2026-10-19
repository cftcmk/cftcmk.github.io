import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Check, Trash2, Sparkles, RefreshCw } from 'lucide-react';
import { ProductModel, VariantSKU } from '../types/inventory';

interface UploadImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ProductModel | null;
  variant: VariantSKU | null;
  onSaveImage: (modelCode: string, variantCode: string, imageUrl: string) => void;
}

// Curated high quality curtain and shade sample presets
const SAMPLE_PRESETS = [
  {
    name: '百葉木紋實景 (Wood Grain)',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: '簡約純白風琴簾 (Pleated White)',
    url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef5?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: '大地灰織紋布料 (Linen Gray)',
    url: 'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: '柔和奶茶色遮光簾 (Ecru Shade)',
    url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
  },
];

export const UploadImageModal: React.FC<UploadImageModalProps> = ({
  isOpen,
  onClose,
  model,
  variant,
  onSaveImage,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [urlInput, setUrlInput] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (variant && isOpen) {
      setSelectedImage(variant.customImage || model?.image || '');
      setUrlInput(variant.customImage || '');
    }
  }, [variant, model, isOpen]);

  if (!isOpen || !model || !variant) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setSelectedImage(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      setSelectedImage(urlInput.trim());
    }
  };

  const handleClearImage = () => {
    setSelectedImage('');
    setUrlInput('');
  };

  const handleSave = () => {
    onSaveImage(model.code, variant.code, selectedImage);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-[#dce5dc] relative max-h-[92vh] overflow-y-auto">
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
          <div className="w-10 h-10 rounded-2xl bg-[#eff3ee] text-[#547a6b] flex items-center justify-center shadow-2xs border border-[#dce5dc]">
            <Upload className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#2d4237]">編輯與上傳產品照片</h3>
            <p className="text-xs text-[#71877c] mt-0.5">
              規格：<strong className="text-[#7da8a3]">{model.code}</strong> - <strong className="text-[#e25b24]">{variant.code}</strong> ({variant.name})
            </p>
          </div>
        </div>

        {/* Body Container: Split into Live Preview & Upload Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
          {/* Left Column: Real-time Photo Preview */}
          <div className="sm:col-span-5 flex flex-col items-center">
            <span className="text-xs font-semibold text-[#52695e] mb-2 self-start">
              實時顯示預覽
            </span>
            <div className="w-full aspect-[3/4] max-w-[210px] rounded-2xl bg-[#f4f7f3] border-2 border-dashed border-[#bcd0c5] shadow-xs flex flex-col items-center justify-center relative overflow-hidden group">
              {selectedImage ? (
                <>
                  <img
                    src={selectedImage}
                    alt="產品照片預覽"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={handleClearImage}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors shadow-xs cursor-pointer"
                    title="移除照片"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <ImageIcon className="w-8 h-8 text-[#98b5af] mb-2 opacity-80" />
                  <span className="text-xs font-bold text-[#4a6358]">Product Image</span>
                  <span className="text-[11px] text-[#7da8a3] font-mono font-bold mt-1">
                    {variant.code}
                  </span>
                  <span className="text-[10px] text-[#86a297] mt-0.5">{variant.name}</span>
                  <span className="text-[9px] text-[#9bb0a5] mt-2">（尚無自訂實拍照片）</span>
                </div>
              )}
            </div>
            {selectedImage && (
              <span className="text-[10px] text-[#547a6b] font-medium mt-1.5 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> 已載入照片
              </span>
            )}
          </div>

          {/* Right Column: Upload Methods */}
          <div className="sm:col-span-7 space-y-4">
            {/* 1. Drag & Drop File Picker */}
            <div>
              <span className="text-xs font-semibold text-[#52695e] block mb-1.5">
                從電腦本機上傳圖片檔案
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all duration-200 ${
                  isDragOver
                    ? 'border-[#547a6b] bg-[#eef5ee]'
                    : 'border-[#c6d7cc] bg-[#f8faf7] hover:bg-[#eef4ee] hover:border-[#9abeb0]'
                }`}
              >
                <Upload className="w-5 h-5 text-[#547a6b] mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-[#324a3e]">點擊選擇 或 拖曳照片至此</p>
                <p className="text-[10px] text-[#7a9185] mt-0.5">支援 JPG, PNG, WEBP 高畫質照片</p>
              </div>
            </div>

            {/* 2. Direct Image URL Input */}
            <div>
              <span className="text-xs font-semibold text-[#52695e] block mb-1">
                或輸入網路圖片 URL 網址
              </span>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3 py-1.5 text-xs bg-[#f8faf7] border border-[#d2ded2] rounded-xl focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3 py-1.5 rounded-xl bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-medium cursor-pointer transition-colors shrink-0 shadow-2xs"
                >
                  套用
                </button>
              </div>
            </div>

            {/* 3. Preset Quick Samples */}
            <div>
              <span className="text-xs font-semibold text-[#52695e] block mb-1.5">
                快速選用預設高畫質窗簾照片
              </span>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => {
                      setSelectedImage(p.url);
                      setUrlInput(p.url);
                    }}
                    className="p-2 rounded-xl bg-[#f8faf7] hover:bg-[#eff4ee] border border-[#d6e2d6] text-left text-[11px] text-[#3e564a] font-medium transition-all cursor-pointer truncate flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#547a6b] shrink-0" />
                    <span className="truncate">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-[#edf2ec] flex items-center justify-between">
          <button
            type="button"
            onClick={handleClearImage}
            className="text-xs text-[#8c4646] hover:underline cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>恢復預設模板</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-[#d6e0d5] text-[#556e62] hover:bg-[#edf2ec] text-xs font-medium cursor-pointer transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-full bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-semibold shadow-2xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>儲存更新照片</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
