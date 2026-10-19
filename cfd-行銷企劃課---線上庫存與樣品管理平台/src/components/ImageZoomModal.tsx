import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Maximize2, RotateCcw, Sparkles } from 'lucide-react';
import { ProductModel, VariantSKU } from '../types/inventory';

interface ImageZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  model: ProductModel | null;
  variant: VariantSKU | null;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  isOpen,
  onClose,
  model,
  variant,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1.5);
  const [viewMode, setViewMode] = useState<'photo' | 'template'>('photo');

  if (!isOpen || !model || !variant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-3xl rounded-3xl p-6 shadow-2xl border border-[#dce5dc] relative flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#edf2ec] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#eff3ee] text-[#739a85] flex items-center justify-center">
              <ZoomIn className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#7da8a3] text-lg">{variant.code}</span>
                <span className="font-bold text-[#2d4237] text-sm">{model.name}</span>
              </div>
              <p className="text-xs text-[#6e8579]">
                規格色票: {variant.name} · 高清細節紋理放大檢視
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#6f877b] hover:bg-[#edf2ec] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zoom Controls Toolbar */}
        <div className="flex items-center justify-between bg-[#eff3ee] px-4 py-2 rounded-2xl mb-4 text-xs text-[#334a41]">
          <div className="flex items-center gap-2">
            <span className="font-semibold">放大倍率:</span>
            <button
              onClick={() => setZoomLevel((z) => Math.max(1, z - 0.25))}
              className="p-1 rounded-lg bg-white hover:bg-[#e4ece2] text-[#425d50] shadow-2xs transition-colors cursor-pointer"
              title="縮小"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold w-12 text-center tabular-nums">
              {(zoomLevel * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, z + 0.25))}
              className="p-1 rounded-lg bg-white hover:bg-[#e4ece2] text-[#425d50] shadow-2xs transition-colors cursor-pointer"
              title="放大"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-2 py-1 rounded-lg bg-white hover:bg-[#e4ece2] text-[11px] font-medium transition-colors cursor-pointer ml-1"
            >
              重置 100%
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setViewMode('photo')}
              className={`px-3 py-1 rounded-xl font-medium transition-all cursor-pointer ${
                viewMode === 'photo'
                  ? 'bg-white text-[#2c3e35] shadow-2xs font-semibold'
                  : 'text-[#64796e]'
              }`}
            >
              實物攝影
            </button>
            <button
              onClick={() => setViewMode('template')}
              className={`px-3 py-1 rounded-xl font-medium transition-all cursor-pointer ${
                viewMode === 'template'
                  ? 'bg-white text-[#2c3e35] font-semibold shadow-2xs'
                  : 'text-[#64796e]'
              }`}
            >
              Product Image 模板線框
            </button>
          </div>
        </div>

        {/* Viewport with Zoom */}
        <div className="flex-1 overflow-auto rounded-2xl bg-[#f8faf7] border border-[#e1e9df] flex items-center justify-center p-6 relative select-none min-h-[380px]">
          {viewMode === 'photo' ? (
            <div
              className="transition-transform duration-200 ease-out origin-center"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <img
                src={
                  variant.customImage ||
                  (model.image && !model.image.includes('shade_no_tool_ezstick') ? model.image : null) ||
                  model.variants.find((v) => Boolean(v.customImage))?.customImage ||
                  (model.image ? model.image.replace('/src/assets/images/', '/images/') : '')
                }
                alt={`${model.name} - ${variant.name}`}
                onError={() => {
                  setViewMode('template');
                }}
                className="max-h-[360px] object-contain rounded-xl shadow-md border border-white"
              />
            </div>
          ) : (
            <div
              className="w-64 aspect-[3/4] border-2 border-[#8eb5b0] bg-white rounded-md flex flex-col items-center justify-center p-6 text-center transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            >
              <span className="text-xl font-medium text-[#4a6358] tracking-wider">
                Product Image
              </span>
              <span className="text-xs text-[#7da8a3] mt-2 font-mono">
                {model.code} - {variant.code}
              </span>
              <span className="text-[11px] text-[#86a297] mt-1">
                {variant.name} ({model.dimensions})
              </span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 mt-3 flex items-center justify-between text-xs text-[#71877c]">
          <span>滾動或點擊按鈕自由縮放 · 檢視材質纖維與窗簾結構</span>
          <button
            onClick={onClose}
            className="px-6 py-1.5 rounded-full bg-[#93b7b2] hover:bg-[#82a8a3] text-white font-medium transition-colors shadow-2xs cursor-pointer"
          >
            關閉檢視
          </button>
        </div>
      </div>
    </div>
  );
};
