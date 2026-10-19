import React from 'react';
import { MainCategory, BorrowRecord } from '../types/inventory';
import { Layers, ArrowRight, Clock, MapPin } from 'lucide-react';

interface KanbanViewProps {
  categories: MainCategory[];
  borrows: BorrowRecord[];
}

export const KanbanView: React.FC<KanbanViewProps> = ({ categories, borrows }) => {
  const activeBorrows = borrows.filter((b) => b.status === '借用中');

  return (
    <div className="w-full bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-[#e1e9df] space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#31473d]">
          樣品即時流通看板
        </h2>
        <p className="text-xs text-[#6e8579] mt-0.5">
          全局透視各系列樣品實體流向、借調人員與在庫健康狀態。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: 在席展示 (Office & Showroom) */}
        <div className="bg-[#eff3ee] rounded-2xl p-4 border border-[#e1e9df]">
          <div className="flex items-center justify-between pb-3 border-b border-[#e1e8df] mb-3">
            <span className="font-bold text-xs text-[#354c42]">總部在席與展示樣品</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-[#526b5f]">
              充足
            </span>
          </div>
          <div className="space-y-2.5">
            {categories.slice(0, 2).map((cat) =>
              cat.models.slice(0, 2).map((m) => (
                <div key={m.code} className="bg-white p-3 rounded-xl shadow-2xs text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-[#7da8a3]">{m.code}</span>
                    <span className="text-[10px] text-[#71887e]">{m.subCategory}</span>
                  </div>
                  <p className="font-medium text-[#2d4237] mt-1 truncate">{m.name}</p>
                  <div className="mt-2 pt-2 border-t border-[#f0f4ef] flex items-center justify-between text-[11px] text-[#556960]">
                    <span>在席規格: {m.variants.length} 種</span>
                    <span className="text-emerald-700 font-semibold">在庫可借</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: 借調中樣品 (Active Borrowed) */}
        <div className="bg-[#eff3ee] rounded-2xl p-4 border border-[#e1e9df]">
          <div className="flex items-center justify-between pb-3 border-b border-[#e1e8df] mb-3">
            <span className="font-bold text-xs text-[#354c42]">目前借出流通中</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#fdeee4] text-[#b85628]">
              {activeBorrows.length} 筆
            </span>
          </div>
          <div className="space-y-2.5">
            {activeBorrows.map((b) => (
              <div key={b.id} className="bg-white p-3 rounded-xl shadow-2xs text-xs border-l-4 border-l-[#e25b24]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#7da8a3]">{b.modelCode}-{b.skuCode}</span>
                  <span className="text-[10px] font-mono text-[#71887e]">{b.expectedReturnDate} 歸還</span>
                </div>
                <p className="font-medium text-[#2d4237] mt-1 truncate">{b.modelName}</p>
                <div className="mt-2 pt-2 border-t border-[#f0f4ef] flex items-center justify-between text-[11px] text-[#556960]">
                  <span className="font-semibold text-[#334a41]">{b.borrower}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#f6f8f5] text-[10px] text-[#556a5f]">
                    {b.purpose}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: 拍攝與展演維護 (Photoshoot / Maintenance) */}
        <div className="bg-[#eff3ee] rounded-2xl p-4 border border-[#e1e9df]">
          <div className="flex items-center justify-between pb-3 border-b border-[#e1e8df] mb-3">
            <span className="font-bold text-xs text-[#354c42]">攝影排程與展會</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-[#526b5f]">
              排程中
            </span>
          </div>
          <div className="space-y-2.5">
            <div className="bg-white p-3 rounded-xl shadow-2xs text-xs">
              <span className="text-[10px] text-[#e25b24] font-bold block">攝影棚 B 棚新品拍攝</span>
              <p className="font-medium text-[#2d4237] mt-1">ED Cordless 1" LF Pleated Shade (001 White)</p>
              <div className="mt-2 text-[11px] text-[#71887e] flex items-center justify-between">
                <span>攝影師: 林阿宏</span>
                <span className="font-mono">預計 10/05 驗退</span>
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl shadow-2xs text-xs">
              <span className="text-[10px] text-[#477a6f] font-bold block">台北建材展覽樣品館</span>
              <p className="font-medium text-[#2d4237] mt-1">QJ Cordless 2" Faux Wood Blind (002 Dark Oak)</p>
              <div className="mt-2 text-[11px] text-[#71887e] flex items-center justify-between">
                <span>陳列組: 陳思妤</span>
                <span className="font-mono">預計 10/12 歸還</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
