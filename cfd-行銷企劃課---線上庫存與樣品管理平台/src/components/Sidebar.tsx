import React from 'react';
import { MainCategory } from '../types/inventory';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface SidebarProps {
  categories: MainCategory[];
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  return (
    <aside className="w-full lg:w-56 shrink-0 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 sm:gap-3.5 pb-2 lg:pb-0 scrollbar-none select-none pt-1 lg:pt-2 relative">
      {categories.map((cat) => {
        const isActive = cat.id === selectedCategoryId;

        return (
          <div key={cat.id} className="shrink-0 lg:w-full relative flex items-center group">
            {/* Category Button with consistent block width on mobile, full width on desktop */}
            <button
              onClick={() => onSelectCategory(cat.id)}
              className={`w-full py-2.5 px-4 sm:py-3.5 sm:px-5 lg:py-5 lg:px-6 rounded-xl text-center font-semibold tracking-wide transition-all duration-300 cursor-pointer whitespace-nowrap lg:whitespace-normal ${
                isActive
                  ? 'bg-[#98bdb9] shadow-xs ring-1 ring-white/60'
                  : 'bg-[#98bdb9]/80 hover:bg-[#98bdb9] hover:shadow-2xs'
              }`}
            >
              <span
                className={`text-sm sm:text-base md:text-lg block transition-all duration-300 break-words [word-break:keep-all] ${
                  isActive
                    ? 'text-white font-bold opacity-100 scale-[1.02]'
                    : 'text-white/50 group-hover:text-white/90 group-hover:scale-[1.01]'
                }`}
              >
                {cat.name}
              </span>
            </button>

            {/* Silky Liquid Animated Arrow Indicator (Desktop only) */}
            {isActive && (
              <motion.div
                layoutId="category-liquid-arrow"
                transition={{
                  type: 'spring',
                  stiffness: 340,
                  damping: 24,
                  mass: 0.8,
                }}
                className="hidden lg:flex absolute -right-5 z-20 items-center justify-center pointer-events-none"
              >
                {/* Outer fluid ripple aura */}
                <div className="absolute inset-0 w-11 h-11 -m-0.5 rounded-full bg-[#749c6e]/20 animate-liquid-ripple pointer-events-none" />

                {/* Main liquid white droplet */}
                <div className="relative w-10 h-10 flex items-center justify-center bg-white shadow-md border border-[#e1e9df] animate-liquid-morph">
                  {/* Subtle fluid connector tail pointing from button */}
                  <div className="absolute -left-1.5 w-3 h-3 bg-white rotate-45 border-l border-b border-[#e1e9df]/40 -z-10" />

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
    </aside>
  );
};
