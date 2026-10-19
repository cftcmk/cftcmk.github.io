import React, { useState, useEffect } from 'react';
import { ProductModel, VariantSKU } from '../types/inventory';
import {
  Eye,
  FileText,
  Pencil,
  Plus,
  ChevronLeft,
  ZoomIn,
  Camera,
  ImagePlus,
  Lock,
  Trash2,
} from 'lucide-react';
import { ImageZoomModal } from './ImageZoomModal';

interface VariantDetailPanelProps {
  model: ProductModel;
  selectedVariantCode: string;
  onSelectVariant: (code: string) => void;
  onQuickBorrow: (model: ProductModel, variant: VariantSKU) => void;
  onEditStock: (model: ProductModel, variant: VariantSKU) => void;
  onViewDoc: (model: ProductModel, variant: VariantSKU) => void;
  onBack: () => void;
  isAdmin?: boolean;
  onEditImage?: (model: ProductModel, variant: VariantSKU) => void;
  onDeleteVariant?: (model: ProductModel, variant: VariantSKU) => void;
  onEditModel?: (model: ProductModel) => void;
  onDeleteModel?: (model: ProductModel) => void;
}

export const VariantDetailPanel: React.FC<VariantDetailPanelProps> = ({
  model,
  selectedVariantCode,
  onSelectVariant,
  onQuickBorrow,
  onEditStock,
  onViewDoc,
  onBack,
  isAdmin = false,
  onEditImage,
  onDeleteVariant,
  onEditModel,
  onDeleteModel,
}) => {
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);
  const [isImageHovered, setIsImageHovered] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  const currentVariant =
    model.variants.find((v) => v.code === selectedVariantCode) ||
    model.variants[0];

  useEffect(() => {
    setImageError(false);
  }, [selectedVariantCode, model.code]);

  // Resolve best available photo: specific variant -> model-level image -> any variant with image
  const displayImage =
    currentVariant?.customImage ||
    (model.image && !model.image.includes('shade_no_tool_ezstick') ? model.image : null) ||
    model.variants.find((v) => Boolean(v.customImage))?.customImage ||
    null;

  const hasCustomPhoto = Boolean(
    currentVariant?.customImage ||
    (model.image && !model.image.includes('shade_no_tool_ezstick')) ||
    model.variants.some((v) => Boolean(v.customImage))
  );

  return (
    <div className="w-full lg:w-[56%] xl:w-[58%] flex flex-col justify-between bg-[#eff3ee] rounded-2xl p-4 sm:p-5 md:p-7 border border-[#e1e9df] relative">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-5 sm:mb-6 flex-wrap leading-snug">
          <div className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base md:text-lg font-bold flex-wrap">
            {model.subCategory && model.subCategory !== 'Blinds' && (
              <span className="text-[#334a41] shrink-0">{model.subCategory}</span>
            )}
            <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#7da8a3] shrink-0">
              {model.code}
            </span>
            <span className="text-[#334a41] font-medium text-xs sm:text-sm md:text-base break-words [word-break:keep-all] sm:[word-break:normal]">
              {model.name}
            </span>
          </div>

          {(onEditModel || onDeleteModel) && (
            <div className="flex items-center gap-1.5 shrink-0">
              {onEditModel && (
                <button
                  type="button"
                  onClick={() => onEditModel(model)}
                  title="編輯此型號規格"
                  className="px-2.5 py-1 rounded-lg bg-white/90 hover:bg-white text-[#446654] border border-[#c9d8cb] text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                >
                  <Pencil className="w-3 h-3 text-[#547a6b]" />
                  <span>編輯型號</span>
                </button>
              )}
              {onDeleteModel && (
                <button
                  type="button"
                  onClick={() => onDeleteModel(model)}
                  title="刪除此型號及其所有規格"
                  className="px-2.5 py-1 rounded-lg bg-[#fde8e8] hover:bg-[#fad0d0] text-[#c0392b] border border-[#f5c6cb] text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>刪除型號</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Body: Downward block stack on mobile, 2-column grid on md+ */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start w-full">
          {/* Variant SKU cards list */}
          <div className="w-full md:col-span-7 flex flex-col gap-2.5">
            {model.variants.map((v) => {
              const isSelected = v.code === currentVariant?.code;

              return (
                <div
                  key={v.code}
                  onClick={() => onSelectVariant(v.code)}
                  className={`w-full flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-xl cursor-pointer transition-all duration-200 overflow-hidden ${
                    isSelected
                      ? 'bg-white shadow-xs border-2 border-[#7da8a3] ring-1 ring-[#7da8a3]/30 scale-[1.01]'
                      : 'bg-white/85 hover:bg-white hover:scale-[1.005] hover:shadow-2xs border border-transparent'
                  }`}
                >
                  {/* Left: Code & Color Name with grammatical wrapping */}
                  <div className="flex flex-col min-w-0 pr-1 shrink-0">
                    <span
                      className={`text-sm sm:text-base font-extrabold tracking-tight whitespace-nowrap transition-colors ${
                        isSelected ? 'text-[#568781]' : 'text-[#8da8a3]'
                      }`}
                    >
                      {v.code}
                    </span>
                    <span className="text-[11px] sm:text-xs text-[#52685f] font-medium truncate mt-0.5 max-w-[85px] sm:max-w-[130px]">
                      {v.name}
                    </span>
                  </div>

                  {/* Right: Round Action Buttons - Fully constrained with zero overflow */}
                  <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* 1. Eye Button: Trigger Zoom / Magnifier */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectVariant(v.code);
                        setIsZoomModalOpen(true);
                      }}
                      title="觸發放大檢視樣品細節"
                      className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-[#96beba] hover:bg-[#7faea8] text-white flex items-center justify-center transition-all duration-200 hover:scale-115 active:scale-95 shadow-2xs cursor-pointer shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5 stroke-[2]" />
                    </button>

                    {/* 2. Document Button: View spec card */}
                    <button
                      type="button"
                      onClick={() => onViewDoc(model, v)}
                      title="查看企劃樣品規格資料卡"
                      className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-[#96beba] hover:bg-[#7faea8] text-white flex items-center justify-center transition-all duration-200 hover:scale-115 active:scale-95 shadow-2xs cursor-pointer shrink-0"
                    >
                      <FileText className="w-3.5 h-3.5 stroke-[2]" />
                    </button>

                    {/* 3. Pencil Button: Edit stock (Admin Only) */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => onEditStock(model, v)}
                        title="編輯盤點庫存與備註 (管理員專用)"
                        className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-[#96beba] hover:bg-[#7faea8] text-white flex items-center justify-center transition-all duration-200 hover:scale-115 active:scale-95 shadow-2xs cursor-pointer shrink-0"
                      >
                        <Pencil className="w-3.5 h-3.5 stroke-[2]" />
                      </button>
                    )}

                    {/* 4. Plus Button: Quick borrow (Available to everyone) */}
                    <button
                      type="button"
                      onClick={() => onQuickBorrow(model, v)}
                      title="快速填寫借用調撥單"
                      className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-[#96beba] hover:bg-[#7faea8] text-white flex items-center justify-center transition-all duration-200 hover:scale-115 active:scale-95 shadow-2xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>

                    {/* 5. Trash Button: Delete variant SKU */}
                    {onDeleteVariant && (
                      <button
                        type="button"
                        onClick={() => onDeleteVariant(model, v)}
                        title="刪除此規格品項"
                        className="w-6.5 h-6.5 sm:w-7 sm:h-7 rounded-full bg-[#fde8e8] hover:bg-[#fad0d0] text-[#c0392b] flex items-center justify-center transition-all duration-200 hover:scale-115 active:scale-95 shadow-2xs cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3 h-3 stroke-[2.2]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right/Bottom Column: Product Image Box - 100% uniform width on mobile */}
          <div className="w-full md:col-span-5 flex flex-col items-center">
            {/* Product Image Frame */}
            <div
              onClick={() => setIsZoomModalOpen(true)}
              onMouseEnter={() => setIsImageHovered(true)}
              onMouseLeave={() => setIsImageHovered(false)}
              className="w-full aspect-[4/3] sm:aspect-[3/4] max-w-full md:max-w-[280px] rounded-xl sm:rounded-sm bg-white border border-[#98bdb9] shadow-2xs flex flex-col items-center justify-center p-3 sm:p-4 relative group cursor-pointer overflow-hidden transition-all duration-300 hover:border-[#7da8a3] hover:shadow-md"
              title="點擊觸發全屏放大檢視"
            >
              {displayImage && !imageError ? (
                <img
                  src={displayImage}
                  alt={`${model.name} - ${currentVariant?.name}`}
                  onError={() => setImageError(true)}
                  className="w-full h-full object-cover rounded-md sm:rounded-xs transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                /* Product Image text centered - Exact from image.png */
                <div className="flex flex-col items-center justify-center text-center select-none transition-transform duration-300 group-hover:scale-105 p-3">
                  <span className="text-base sm:text-lg font-medium text-[#4a6358] tracking-wider">
                    Product Image
                  </span>
                  <span className="text-xs sm:text-[13px] text-[#7da8a3] mt-2 font-mono font-bold">
                    {currentVariant?.code}
                  </span>
                  <span className="text-[11px] text-[#86a297] mt-0.5 break-words [word-break:keep-all]">
                    {currentVariant?.name}
                  </span>
                </div>
              )}

              {/* Trigger Magnifier Hover Hint Badge */}
              <div className="absolute inset-x-3 bottom-3 py-1.5 px-2 bg-[#96beba]/90 text-white rounded-md text-[10px] flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0 shadow-xs">
                <ZoomIn className="w-3 h-3" />
                <span>點擊觸發放大檢視</span>
              </div>
            </div>

            {/* 新增圖片 / 編輯產品照片 Icon 按鈕 (位置於圖片顯示正下方) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditImage?.(model, currentVariant);
              }}
              className="w-full max-w-full md:max-w-[280px] mt-2 py-2 px-3.5 rounded-xl bg-white hover:bg-[#eef4ee] border border-[#bcd0c5] hover:border-[#9abeb0] text-[#365749] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-2xs hover:shadow-xs cursor-pointer group"
              title={isAdmin ? (hasCustomPhoto ? '編輯/更換產品照片' : '新增產品照片') : '需要管理者權限方可上傳或更換照片'}
            >
              {hasCustomPhoto ? (
                <Camera className="w-3.5 h-3.5 text-[#548074] group-hover:scale-110 transition-transform" />
              ) : (
                <ImagePlus className="w-3.5 h-3.5 text-[#548074] group-hover:scale-110 transition-transform" />
              )}
              <span>{hasCustomPhoto ? '編輯產品照片' : '新增產品照片'}</span>
              {!isAdmin && <Lock className="w-3 h-3 text-[#8ca398] ml-1" />}
            </button>

            {/* Quick stock status pill beneath photo - Same unified width */}
            <div className="w-full max-w-full md:max-w-[280px] mt-2 px-3.5 py-2.5 bg-white/80 rounded-xl text-xs flex items-center justify-between text-[#51675e] border border-[#e1e9df]/70 shadow-2xs">
              <span>在庫現貨: <strong className="text-[#2c4038] font-bold">{model.variants.length}</strong> 件</span>
              <span>儲位: <strong className="text-[#2c4038] font-mono">{currentVariant?.locationBin}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Right: "< 返回" Pill Button */}
      <div className="mt-6 sm:mt-8 pt-4 flex items-center justify-end border-t border-[#e2e8e0]/60 lg:border-t-0">
        <button
          onClick={onBack}
          className="flex items-center gap-1 px-5 py-1.5 rounded-full bg-[#93b7b2] hover:bg-[#82a8a3] text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>返回</span>
        </button>
      </div>

      {/* Trigger Zoom / Magnifier Modal */}
      <ImageZoomModal
        isOpen={isZoomModalOpen}
        onClose={() => setIsZoomModalOpen(false)}
        model={model}
        variant={currentVariant || null}
      />
    </div>
  );
};
