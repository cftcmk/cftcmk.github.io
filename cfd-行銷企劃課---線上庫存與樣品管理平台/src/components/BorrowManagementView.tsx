import React, { useState } from 'react';
import { BorrowRecord, MainCategory } from '../types/inventory';
import { CheckCircle2, Search, Plus, Calendar, Clock, AlertCircle } from 'lucide-react';

interface BorrowManagementViewProps {
  borrows: BorrowRecord[];
  onReturnSample: (id: string) => void;
  onOpenNewBorrow: () => void;
}

export const BorrowManagementView: React.FC<BorrowManagementViewProps> = ({
  borrows,
  onReturnSample,
  onOpenNewBorrow,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filtered = borrows.filter((b) => {
    if (filterStatus !== 'ALL' && b.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.borrower.toLowerCase().includes(q) ||
        b.modelCode.toLowerCase().includes(q) ||
        b.modelName.toLowerCase().includes(q) ||
        b.purpose.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="w-full bg-white rounded-3xl p-6 md:p-8 shadow-xs border border-[#e1e9df] space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#eff3ee]">
        <div>
          <h2 className="text-xl font-bold text-[#31473d]">
            樣品借用與流通管理
          </h2>
          <p className="text-xs text-[#6e8579] mt-0.5">
            CFD 行銷企劃課各系列樣品借用登記、拍攝排程與即時歸還追蹤。
          </p>
        </div>

        <button
          onClick={onOpenNewBorrow}
          className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#93b7b2] hover:bg-[#82a8a3] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>填寫借用申請</span>
        </button>
      </div>

      {/* Filter and search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          {['ALL', '借用中', '已歸還'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-4 py-1.5 rounded-full font-medium transition-all ${
                filterStatus === st
                  ? 'bg-[#93b7b2] text-white shadow-2xs font-semibold'
                  : 'bg-[#f0f4ef] text-[#556b60] hover:bg-[#e4ece3]'
              }`}
            >
              {st === 'ALL' ? '全部清單' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7f978c]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜尋借用人、品號 (例: ED, 張雅婷)..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#f0f4ef] text-xs text-[#2d4237] rounded-full border border-transparent focus:border-[#93b7b2] focus:bg-white focus:outline-hidden"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#e5ece3] text-[#637a6e]">
              <th className="py-2.5 px-3 font-semibold">申請單號</th>
              <th className="py-2.5 px-3 font-semibold">型號與色票</th>
              <th className="py-2.5 px-3 font-semibold">規格品名</th>
              <th className="py-2.5 px-3 font-semibold">借用人 / 部門</th>
              <th className="py-2.5 px-3 font-semibold">借調用途</th>
              <th className="py-2.5 px-3 font-semibold">借用日 ~ 預計歸還</th>
              <th className="py-2.5 px-3 font-semibold text-center">狀態</th>
              <th className="py-2.5 px-3 font-semibold text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eff4ee]">
            {filtered.map((b) => (
              <tr key={b.id} className="hover:bg-[#f8faf7] transition-colors">
                <td className="py-3.5 px-3 font-mono text-[#61786c]">{b.id}</td>
                <td className="py-3.5 px-3">
                  <span className="font-bold text-[#7da8a3] mr-1">{b.modelCode}</span>
                  <span className="font-bold text-[#e25b24] mr-1">{b.skuCode}</span>
                  <span className="text-[#334a41]">{b.variantName}</span>
                </td>
                <td className="py-3.5 px-3 font-medium text-[#2d4237] max-w-[200px] truncate">
                  {b.modelName}
                </td>
                <td className="py-3.5 px-3">
                  <p className="font-semibold text-[#2d4237]">{b.borrower}</p>
                  <p className="text-[10px] text-[#71887c]">{b.department}</p>
                </td>
                <td className="py-3.5 px-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#eff4ee] text-[#4d665b]">
                    {b.purpose}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-[#64796e] font-mono text-[11px]">
                  {b.borrowDate} ~ {b.expectedReturnDate}
                </td>
                <td className="py-3.5 px-3 text-center">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      b.status === '借用中'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
                <td className="py-3.5 px-3 text-right">
                  {b.status === '借用中' && (
                    <button
                      onClick={() => onReturnSample(b.id)}
                      className="px-3 py-1 bg-[#93b7b2] hover:bg-[#82a8a3] text-white rounded-lg text-[11px] font-medium transition-colors cursor-pointer"
                    >
                      驗收歸還
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[#7e9488]">
                  查無符合之借用紀錄
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
