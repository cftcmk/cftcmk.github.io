import React from 'react';
import { ProductModel } from '../types/inventory';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductModelListProps {
  models: ProductModel[];
  selectedModelCode: string;
  onSelectModel: (code: string) => void;
  subCategoryTitle?: string;
  showTitle?: boolean;
}

export const ProductModelList: React.FC<ProductModelListProps> = ({
  models,
  selectedModelCode,
  onSelectModel,
  subCategoryTitle,
  showTitle = true,
}) => {
  return (
    <div className="w-full lg:w-[44%] xl:w-[42%] flex flex-col bg-[#eff3ee] rounded-2xl p-4 sm:p-5 md:p-7 border border-[#e1e9df] relative">
      {/* Centered Title at top (e.g. "EZ Stick") */}
      {showTitle && subCategoryTitle && (
        <div className="text-center mb-4 sm:mb-6">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#4d5d55] tracking-wide break-words [word-break:keep-all]">
            {subCategoryTitle}
          </h3>
        </div>
      )}

      {/* Model Items List */}
      <div className="flex flex-col gap-2.5 sm:gap-3.5 relative w-full">
        {models.map((model) => {
          const isSelected = model.code === selectedModelCode;

          return (
            <div key={model.code} className="relative flex items-center group w-full">
              <button
                onClick={() => onSelectModel(model.code)}
                className={`w-full flex items-center justify-between rounded-xl text-left transition-all duration-300 ease-out cursor-pointer bg-white ${
                  isSelected
                    ? 'py-3.5 px-4 sm:py-5 sm:px-6 shadow-md ring-1.5 ring-[#7da8a3]/40 z-10 lg:scale-[1.03] lg:translate-x-1'
                    : 'py-3 px-3.5 sm:py-3.5 sm:px-5 hover:bg-white hover:shadow-xs opacity-75 hover:opacity-100 hover:scale-[1.01]'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 pr-2 flex-1">
                  {/* Large Model Code on Left */}
                  <span
                    className={`shrink-0 font-extrabold tracking-tight transition-all duration-300 min-w-[2.5rem] sm:min-w-[2.8rem] whitespace-nowrap ${
                      isSelected
                        ? 'text-2xl sm:text-3xl md:text-4xl text-[#7da8a3]'
                        : 'text-xl sm:text-2xl md:text-3xl text-[#7da8a3]/75 group-hover:text-[#7da8a3]'
                    }`}
                  >
                    {model.code}
                  </span>

                  {/* Clean Specification Title with natural linguistic wrapping */}
                  <div className="flex flex-col min-w-0 justify-center flex-1">
                    <span
                      className={`font-semibold tracking-wide transition-all duration-300 leading-snug break-words [word-break:keep-all] sm:[word-break:normal] ${
                        isSelected
                          ? 'text-xs sm:text-sm md:text-base text-[#2c3e35]'
                          : 'text-xs sm:text-sm text-[#465c51]/80 group-hover:text-[#2c3e35]'
                      }`}
                    >
                      {model.name}
                    </span>
                    {model.variants && model.variants.length > 0 && (
                      <span
                        className={`text-[10px] sm:text-[11px] font-normal mt-0.5 transition-colors leading-snug break-words ${
                          isSelected ? 'text-[#5d776b]' : 'text-[#7a9186]/80'
                        }`}
                      >
                        Color : {model.variants.map((v) => v.name).join(' / ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Solid Right Arrow Triangle ▶ */}
                <div className="shrink-0 flex items-center justify-center pl-2">
                  <svg
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-all duration-200 ${
                      isSelected
                        ? 'text-[#7da8a3] scale-125'
                        : 'text-[#98b5af]/70 group-hover:text-[#7da8a3]'
                    }`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                </div>
              </button>

              {/* Silky Liquid Animated Arrow Indicator (Desktop only) */}
              {isSelected && (
                <motion.div
                  layoutId={`model-liquid-arrow-${subCategoryTitle || 'all'}`}
                  transition={{
                    type: 'spring',
                    stiffness: 340,
                    damping: 24,
                    mass: 0.8,
                  }}
                  className="hidden lg:flex absolute -right-6 z-30 items-center justify-center pointer-events-none"
                >
                  {/* Outer fluid ripple aura */}
                  <div className="absolute inset-0 w-12 h-12 -m-1 rounded-full bg-[#749c6e]/20 animate-liquid-ripple pointer-events-none" />

                  {/* Main liquid white droplet */}
                  <div className="relative w-11 h-11 flex items-center justify-center bg-white shadow-md border border-[#e1e9df] animate-liquid-morph">
                    {/* Subtle fluid connector tail */}
                    <div className="absolute -left-1.5 w-3.5 h-3.5 bg-white rotate-45 border-l border-b border-[#e1e9df]/40 -z-10" />

                    {/* Silky fluid gliding arrow */}
                    <div className="animate-fluid-glide flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 stroke-[3] text-[#749c6e]" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          );
        })}

        {models.length === 0 && (
          <div className="py-10 text-center text-sm text-[#7e9488]">
            此分類尚無型號資料
          </div>
        )}
      </div>
    </div>
  );
};
