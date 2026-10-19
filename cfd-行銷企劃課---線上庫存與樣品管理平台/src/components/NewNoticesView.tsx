import React, { useState } from 'react';
import { Bell, ArrowRight, CheckCheck, Plus, Inbox, Package, Trash2, Layers } from 'lucide-react';

export interface NoticeItem {
  id: string;
  category: '新品到庫' | '規格更新' | '借調提醒' | '企劃發布';
  title: string;
  summary: string;
  modelCode: string;
  skuCode: string;
  targetCategoryId: string;
  categoryName?: string;
  quantity?: number;
  date: string;
  isRead: boolean;
  tagColor: string;
  createdAt?: string;
}

export const INITIAL_NOTICES: NoticeItem[] = [];

interface NewNoticesViewProps {
  notices: NoticeItem[];
  onNavigateToItem: (categoryId: string, modelCode: string, skuCode: string) => void;
  onToggleRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotice?: (id: string) => void;
  onAddNew?: () => void;
  isAdmin?: boolean;
}

export const NewNoticesView: React.FC<NewNoticesViewProps> = ({
  notices,
  onNavigateToItem,
  onToggleRead,
  onMarkAllAsRead,
  onDeleteNotice,
  onAddNew,
  isAdmin = true,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  const unreadCount = notices.filter((n) => !n.isRead).length;
  const totalQuantity = notices.reduce((sum, n) => sum + (Number(n.quantity) || 0), 0);

  const filteredNotices = notices.filter((n) => {
    if (activeFilter === 'UNREAD') return !n.isRead;
    return true;
  });

  return (
    <div className="w-full bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xs border border-[#e1e9df] space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#eff3ee]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#edf4ee] text-[#547a6b] flex items-center justify-center shadow-2xs shrink-0 border border-[#d8e6da]">
            <Bell className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-[#31473d]">
                新品通知與樣品動態
              </h2>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#ff4d2e] text-white shadow-2xs animate-pulse">
                  {unreadCount} 個新品未讀
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-[#6e8579] mt-0.5 leading-snug">
              掌握 CFD 行銷企劃課最新打樣到庫、新規格入庫與即時通知。
            </p>
          </div>
        </div>

        {/* Action Controls & Statistics */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-between lg:justify-end pt-1 lg:pt-0">
          {notices.length > 0 && (
            <div className="flex items-center gap-2 text-xs bg-[#f4f7f4] px-3 py-1.5 rounded-full border border-[#dfe7e0] text-[#4d6657]">
              <span>共 <strong className="text-[#2d4237] font-bold">{notices.length}</strong> 項新品</span>
              <span className="text-[#bdcebf]">•</span>
              <span>累計入庫 <strong className="text-[#2c5f40] font-bold">+{totalQuantity}</strong> 件</span>
            </div>
          )}

          {notices.length > 0 && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#edf3ed] hover:bg-[#e2ede2] text-[#335645] text-xs font-semibold transition-colors cursor-pointer border border-[#cddccd]"
                  title="將所有新品通知標記為已讀"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-[#4e7966]" />
                  <span>全部標為已讀</span>
                </button>
              )}

              <div className="flex items-center bg-[#f0f4ef] p-1 rounded-full text-xs">
                <button
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    activeFilter === 'ALL'
                      ? 'bg-white text-[#2c4038] font-bold shadow-2xs'
                      : 'text-[#5d7369]'
                  }`}
                >
                  全部 ({notices.length})
                </button>
                <button
                  onClick={() => setActiveFilter('UNREAD')}
                  className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                    activeFilter === 'UNREAD'
                      ? 'bg-white text-[#2c4038] font-bold shadow-2xs'
                      : 'text-[#5d7369]'
                  }`}
                >
                  未讀 ({unreadCount})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Notices List or Empty State */}
      <div className="space-y-3 sm:space-y-3.5 w-full">
        {notices.length === 0 ? (
          <div className="py-14 sm:py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-[#eff3ee] text-[#739a85] flex items-center justify-center mb-4 shadow-xs border border-[#e1e9df]/60">
              <Inbox className="w-6 h-6 sm:w-7 sm:h-7 stroke-[1.8] opacity-75 text-[#739a85]" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#31473d] mb-1.5">
              目前尚無新品通知
            </h3>
            <p className="text-xs md:text-sm text-[#738b7e] max-w-md leading-relaxed mb-6 break-words [word-break:keep-all]">
              管理者於後台完成「新增品項」建檔入庫後，系統將自動於此即時發布新品到庫通知，並於上方按鈕顯示新增數量。
            </p>
            {isAdmin && onAddNew && (
              <button
                onClick={onAddNew}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#739a85] hover:bg-[#608471] text-white text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>立即點選新增品項入庫</span>
              </button>
            )}
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="py-12 text-center text-sm text-[#7e9488]">
            目前無符合條件的未讀通知項目
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              onClick={() => onToggleRead(notice.id)}
              className={`w-full p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                notice.isRead
                  ? 'bg-white/80 border-[#e5ece2] hover:bg-[#fbfcfb]'
                  : 'bg-[#f4f8f4] border-[#b9d6be] shadow-2xs hover:border-[#9ec4a4]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 mb-2.5">
                <div className="flex items-center gap-2 flex-wrap">
                  {!notice.isRead && (
                    <span className="w-2.5 h-2.5 rounded-full bg-[#ff4500] shrink-0 animate-pulse" />
                  )}
                  {/* Category Badge */}
                  {notice.categoryName && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e8efe9] text-[#335645] border border-[#cadbce] flex items-center gap-1 shrink-0">
                      <Layers className="w-3 h-3 text-[#4e7966]" />
                      <span>{notice.categoryName}</span>
                    </span>
                  )}
                  {/* Notice Type Tag */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${notice.tagColor}`}>
                    {notice.category}
                  </span>
                  {/* Stock Quantity Tag */}
                  {notice.quantity !== undefined && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f4ea] text-[#137333] border border-[#b7e1cd] flex items-center gap-1 shrink-0">
                      <Package className="w-3 h-3 text-[#137333]" />
                      <span>入庫數量：+{notice.quantity} 件</span>
                    </span>
                  )}
                  <span className="text-sm md:text-base font-bold text-[#2d4237] leading-snug break-words">
                    {notice.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] sm:text-[11px] font-mono text-[#789083]">
                    {notice.date}
                  </span>
                  {isAdmin && onDeleteNotice && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNotice(notice.id);
                      }}
                      className="p-1 rounded-full text-[#93aba0] hover:text-[#d32f2f] hover:bg-[#fee8e6] transition-colors cursor-pointer"
                      title="刪除此通知"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-[#526a5e] leading-relaxed mb-3 break-words bg-white/70 p-2.5 rounded-xl border border-[#e5ebe4]">
                {notice.summary}
              </p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-[#e8eee6]">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="text-[#789083]">關聯型號規格：</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#edf3ed] font-extrabold text-[#547a6b] font-mono whitespace-nowrap">
                    {notice.modelCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-[#fbebe4] font-bold text-[#e25b24] font-mono whitespace-nowrap">
                    {notice.skuCode}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleRead(notice.id);
                    onNavigateToItem(notice.targetCategoryId, notice.modelCode, notice.skuCode);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e8f1e9] hover:bg-[#d8e6da] text-xs font-semibold text-[#2c4e3b] transition-colors cursor-pointer group border border-[#c4dcce]"
                >
                  <span>在席清單中檢視規格</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#4e7966]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
