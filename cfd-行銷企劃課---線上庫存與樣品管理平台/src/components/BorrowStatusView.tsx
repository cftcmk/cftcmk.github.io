import React, { useState, useMemo } from 'react';
import { BorrowRecord } from '../types/inventory';
import {
  ClipboardList,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  User,
  Building2,
  Calendar,
  Package,
  Plus,
  Filter,
  Check,
  Trash2,
  X,
  AlertCircle,
  FolderKanban,
  CheckCheck,
  Ban,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface BorrowStatusViewProps {
  borrows: BorrowRecord[];
  onApproveBorrow: (recordId: string) => void;
  onRejectBorrow: (recordId: string, reason?: string) => void;
  onReturnItem: (recordId: string) => void;
  onNavigateToItem: (modelCode: string, skuCode: string) => void;
  onOpenBorrowModal: () => void;
  onDeleteBorrow: (recordId: string) => void;
  isAdmin: boolean;
  onOpenAdminLogin: () => void;
}

export const CATEGORY_OPTIONS = [
  { id: 'ALL', name: '全部項目類別' },
  { id: 'no_tool', name: 'No Tool 無痕黏貼系列' },
  { id: 'blinds', name: 'Blinds 百葉簾系列' },
  { id: 'cellular_shades', name: 'Cellular Shades 風琴簾系列' },
  { id: 'pleated_shades', name: 'Pleated Shades 折景簾系列' },
  { id: 'roman_shades', name: 'Roman Shades 羅馬簾系列' },
  { id: 'roller_shades', name: 'Roller Shades 捲簾系列' },
  { id: 'motorized', name: 'Motorized 電動窗簾系列' },
];

export const BorrowStatusView: React.FC<BorrowStatusViewProps> = ({
  borrows,
  onApproveBorrow,
  onRejectBorrow,
  onReturnItem,
  onNavigateToItem,
  onOpenBorrowModal,
  onDeleteBorrow,
  isAdmin,
  onOpenAdminLogin,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING' | 'ACTIVE' | 'OVERDUE' | 'RETURNED' | 'REJECTED'
  >('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Deletion confirmation modal state
  const [recordToDelete, setRecordToDelete] = useState<BorrowRecord | null>(null);

  // Rejection modal state
  const [recordToReject, setRecordToReject] = useState<BorrowRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('門市展演排程衝突，現存樣品在庫不足');

  // Today's date string in YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Compute status helpers
  const enrichedBorrows = useMemo(() => {
    return borrows.map((b) => {
      let isOverdue = false;
      if (b.status === '借用中' && b.expectedReturnDate < todayStr) {
        isOverdue = true;
      }
      return {
        ...b,
        isOverdue,
      };
    });
  }, [borrows, todayStr]);

  // Statistics
  const totalCount = enrichedBorrows.length;
  const pendingCount = enrichedBorrows.filter((b) => b.status === '待審核').length;
  const activeCount = enrichedBorrows.filter((b) => b.status === '借用中' && !b.isOverdue).length;
  const overdueCount = enrichedBorrows.filter((b) => b.isOverdue || b.status === '逾期待還').length;
  const returnedCount = enrichedBorrows.filter((b) => b.status === '已歸還').length;
  const rejectedCount = enrichedBorrows.filter((b) => b.status === '已駁回').length;

  // Filtered List
  const filteredBorrows = useMemo(() => {
    return enrichedBorrows.filter((b) => {
      // Category filter (依照項目類別進行歸納)
      if (selectedCategoryFilter !== 'ALL') {
        const matchesCatId = b.categoryId === selectedCategoryFilter;
        const matchesCatName = b.categoryName && b.categoryName.includes(
          CATEGORY_OPTIONS.find((c) => c.id === selectedCategoryFilter)?.name.split(' ')[0] || ''
        );
        if (!matchesCatId && !matchesCatName) return false;
      }

      // Review Status filter (待管理員審核檢視)
      if (statusFilter === 'PENDING' && b.status !== '待審核') return false;
      if (statusFilter === 'ACTIVE' && (b.status !== '借用中' || b.isOverdue)) return false;
      if (statusFilter === 'OVERDUE' && !b.isOverdue && b.status !== '逾期待還') return false;
      if (statusFilter === 'RETURNED' && b.status !== '已歸還') return false;
      if (statusFilter === 'REJECTED' && b.status !== '已駁回') return false;

      // Department filter
      if (selectedDept !== 'ALL' && b.department !== selectedDept) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchBorrower = b.borrower.toLowerCase().includes(q);
        const matchId = b.id.toLowerCase().includes(q);
        const matchCat = (b.categoryName || '').toLowerCase().includes(q);
        const matchModel = b.modelCode.toLowerCase().includes(q) || b.modelName.toLowerCase().includes(q);
        const matchSku = b.skuCode.toLowerCase().includes(q) || b.variantName.toLowerCase().includes(q);
        const matchPurpose = b.purpose.toLowerCase().includes(q);
        return matchBorrower || matchId || matchCat || matchModel || matchSku || matchPurpose;
      }

      return true;
    });
  }, [enrichedBorrows, selectedCategoryFilter, statusFilter, selectedDept, searchQuery]);

  // All unique departments for dropdown
  const allDepartments = useMemo(() => {
    const set = new Set<string>();
    borrows.forEach((b) => set.add(b.department));
    return Array.from(set);
  }, [borrows]);

  const confirmDelete = () => {
    if (recordToDelete) {
      onDeleteBorrow(recordToDelete.id);
      setRecordToDelete(null);
    }
  };

  const handleConfirmReject = () => {
    if (recordToReject) {
      onRejectBorrow(recordToReject.id, rejectReason);
      setRecordToReject(null);
    }
  };

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xs border border-[#e2e9e1] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-[#eff3ee] text-[#547a6b] flex items-center justify-center">
              <ClipboardList className="w-4 h-4 stroke-[2.2]" />
            </div>
            <h2 className="text-base sm:text-xl font-bold text-[#2d4237]">
              樣品租借與流通借用狀況
            </h2>
            {pendingCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#ff7a29] text-white text-[10px] font-black animate-pulse">
                {pendingCount} 筆待審核
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#6e8579] max-w-2xl leading-relaxed">
            申請單據依項目系列類別自動歸納。一般人員線上登記後需由<strong>管理者 (Paul Wang)</strong> 進行審核、核准出庫與結案管理。
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          {!isAdmin && (
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#edf4ee] text-[#416152] text-xs font-semibold border border-[#c5d8c8] shadow-2xs transition-all cursor-pointer"
              title="輸入管理者密碼以解鎖核准與刪除管理權限"
            >
              <Lock className="w-3.5 h-3.5 text-[#547a6b]" />
              <span>輸入密碼解鎖管理</span>
            </button>
          )}

          <button
            onClick={onOpenBorrowModal}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>填寫借用申請單</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: 待管理員審核 */}
        <div className={`rounded-2xl p-4 sm:p-5 border shadow-2xs transition-all ${
          pendingCount > 0
            ? 'bg-gradient-to-br from-[#fffdf8] to-[#fff5e6] border-[#ffd6a3] ring-1 ring-[#ffae42]/30'
            : 'bg-white border-[#e2e9e1]'
        }`}>
          <div className="flex items-center justify-between text-xs text-[#a05a1e] mb-1 font-semibold">
            <span>待審核借調</span>
            <Clock className={`w-4 h-4 ${pendingCount > 0 ? 'text-[#ff7a29] animate-spin-slow' : 'text-[#8ba294]'}`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-2xl sm:text-3xl font-extrabold ${pendingCount > 0 ? 'text-[#e65c00]' : 'text-[#2d4237]'}`}>
              {pendingCount}
            </span>
            <span className="text-xs text-[#a05a1e] font-medium">筆待批覆</span>
          </div>
          <div className="text-[11px] text-[#b36b2d] mt-1">需管理者確認後正式出借</div>
        </div>

        {/* Card 2: 借用中 (已核准出借) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#cde0d2] shadow-2xs bg-gradient-to-br from-white to-[#f4f8f4]">
          <div className="flex items-center justify-between text-xs text-[#406253] mb-1 font-semibold">
            <span>借用中 (已核准)</span>
            <Package className="w-4 h-4 text-[#547a6b]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#547a6b]">{activeCount}</span>
            <span className="text-xs text-[#547a6b] font-medium">件流通中</span>
          </div>
          <div className="text-[11px] text-[#698879] mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#547a6b] animate-pulse" />
            <span>在庫數量實時鎖定</span>
          </div>
        </div>

        {/* Card 3: 逾期待還 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#eed7c5] shadow-2xs bg-gradient-to-br from-white to-[#fdf9f6]">
          <div className="flex items-center justify-between text-xs text-[#9d5b32] mb-1 font-semibold">
            <span>逾期待還</span>
            <AlertTriangle className="w-4 h-4 text-[#e25b24]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#e25b24]">{overdueCount}</span>
            <span className="text-xs text-[#e25b24] font-medium">件超期</span>
          </div>
          <div className="text-[11px] text-[#ad7350] mt-1">
            {overdueCount > 0 ? '建議通知借調人歸還' : '目前無逾期記錄'}
          </div>
        </div>

        {/* Card 4: 已歸還結案 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2e9e1] shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#6e8579] mb-1 font-medium">
            <span>已結案歸還</span>
            <CheckCircle2 className="w-4 h-4 text-[#7da8a3]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#2d4237]">{returnedCount}</span>
            <span className="text-xs text-[#71877c]">筆入庫</span>
          </div>
          <div className="text-[11px] text-[#869b8f] mt-1">配額已全數回補庫存</div>
        </div>

        {/* Card 5: 總申請記錄 */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#e2e9e1] shadow-2xs hidden lg:block">
          <div className="flex items-center justify-between text-xs text-[#6e8579] mb-1 font-medium">
            <span>累積申請總數</span>
            <FolderKanban className="w-4 h-4 text-[#7da8a3]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-[#2d4237]">{totalCount}</span>
            <span className="text-xs text-[#71877c]">筆</span>
          </div>
          <div className="text-[11px] text-[#869b8f] mt-1">涵蓋所有系列項目</div>
        </div>
      </div>

      {/* Category Grouping Tabs Bar (依照項目類別進行歸納) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs border border-[#e2e9e1] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#355243] flex items-center gap-1.5">
            <FolderKanban className="w-3.5 h-3.5 text-[#547a6b]" />
            <span>依產品系列項目類別歸納</span>
          </span>
          <span className="text-[11px] text-[#71897c]">
            點選類別切換檢視不同樣品流通
          </span>
        </div>

        {/* Category Horizontal Scrolling Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORY_OPTIONS.map((cat) => {
            const isSelected = selectedCategoryFilter === cat.id;
            const countInCat =
              cat.id === 'ALL'
                ? borrows.length
                : borrows.filter(
                    (b) =>
                      b.categoryId === cat.id ||
                      (b.categoryName && b.categoryName.includes(cat.name.split(' ')[0]))
                  ).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryFilter(cat.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#547a6b] text-white shadow-2xs font-semibold ring-2 ring-[#547a6b]/20'
                    : 'bg-[#f4f7f3] text-[#4d665a] hover:bg-[#e7eee6]'
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-[#e2ebe0] text-[#496557]'
                  }`}
                >
                  {countInCat}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Review Status Filter and Search Bar Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs border border-[#e2e9e1] space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Filter Tabs (審核與狀態篩選) */}
          <div className="flex items-center bg-[#f0f4ef] p-1 rounded-2xl text-xs overflow-x-auto no-scrollbar">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'ALL'
                  ? 'bg-white text-[#2c4038] shadow-xs'
                  : 'text-[#64796e] hover:text-[#2c4038]'
              }`}
            >
              全部 ({totalCount})
            </button>

            {/* 待審核 Filter Tab */}
            <button
              onClick={() => setStatusFilter('PENDING')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'PENDING'
                  ? 'bg-white text-[#e65c00] shadow-xs'
                  : 'text-[#64796e] hover:text-[#2c4038]'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${pendingCount > 0 ? 'bg-[#ff7a29] animate-ping' : 'bg-[#a3b8ac]'}`} />
              <span>待審核 ({pendingCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white text-[#547a6b] shadow-xs'
                  : 'text-[#64796e] hover:text-[#2c4038]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#547a6b]" />
              <span>借用中 ({activeCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('OVERDUE')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'OVERDUE'
                  ? 'bg-white text-[#e25b24] shadow-xs'
                  : 'text-[#64796e] hover:text-[#2c4038]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#e25b24]" />
              <span>逾期 ({overdueCount})</span>
            </button>

            <button
              onClick={() => setStatusFilter('RETURNED')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === 'RETURNED'
                  ? 'bg-white text-[#2c4038] shadow-xs'
                  : 'text-[#64796e] hover:text-[#2c4038]'
              }`}
            >
              已歸還 ({returnedCount})
            </button>

            {rejectedCount > 0 && (
              <button
                onClick={() => setStatusFilter('REJECTED')}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer whitespace-nowrap text-[#a33a2d] ${
                  statusFilter === 'REJECTED'
                    ? 'bg-white text-[#a33a2d] shadow-xs'
                    : 'text-[#846663] hover:text-[#a33a2d]'
                }`}
              >
                已駁回 ({rejectedCount})
              </button>
            )}
          </div>

          {/* Department Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {allDepartments.length > 0 && (
              <div className="flex items-center gap-1 bg-[#f4f7f3] border border-[#dce5dc] px-2.5 py-1.5 rounded-xl text-xs">
                <Filter className="w-3.5 h-3.5 text-[#547a6b] shrink-0" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-transparent text-[#334a41] font-medium focus:outline-hidden text-xs cursor-pointer"
                >
                  <option value="ALL">全部申請部門</option>
                  {allDepartments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Keyword Search */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-[#869b8f] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋單號、姓名、型號、系列..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#f4f7f3] border border-[#dce5dc] rounded-xl text-[#2d4237] focus:outline-hidden focus:bg-white transition-all placeholder:text-[#8ea397]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Borrow Records List */}
      <div className="space-y-3.5">
        {filteredBorrows.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl sm:rounded-3xl p-12 text-center border border-[#e2e9e1] shadow-xs">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-[#eff3ee] text-[#547a6b] flex items-center justify-center mb-3">
              <ClipboardList className="w-7 h-7 opacity-75" />
            </div>
            <h3 className="text-base font-bold text-[#2d4237] mb-1">查無符合條件的租借紀錄</h3>
            <p className="text-xs text-[#71877c] max-w-sm mx-auto mb-5 leading-relaxed">
              目前此項目類別或狀態下無租借單據，您可以切換類別篩選或新增申請。
            </p>
            <button
              onClick={onOpenBorrowModal}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>填寫借用申請單</span>
            </button>
          </div>
        ) : (
          filteredBorrows.map((record) => {
            const isPendingReview = record.status === '待審核';
            const isCurrentlyActive = record.status === '借用中' && !record.isOverdue;
            const isCurrentlyOverdue = record.isOverdue || record.status === '逾期待還';
            const isReturned = record.status === '已歸還';
            const isRejected = record.status === '已駁回';

            return (
              <div
                key={record.id}
                className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-5 border shadow-2xs hover:shadow-xs transition-all duration-200 ${
                  isPendingReview
                    ? 'border-[#ffce99] bg-gradient-to-r from-white via-white to-[#fffcf7]'
                    : 'border-[#e2e9e1] hover:border-[#ccdcd0]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Meta, Category Pill, Specs, Borrower */}
                  <div className="flex-1">
                    {/* Top Meta Line: Status Badge, Category Pill, ID, Date */}
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                      {/* Review / Borrow Status Badge */}
                      {isPendingReview && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fff0e0] text-[#c74e00] text-[11px] font-bold border border-[#ffd2a8]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#ff7a29] animate-ping" />
                          <span>待管理者審核</span>
                        </span>
                      )}
                      {isCurrentlyActive && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#e8f2ea] text-[#345e4a] text-[11px] font-bold border border-[#bcd3c3]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#547a6b] animate-pulse" />
                          <span>借用中 (已核准)</span>
                        </span>
                      )}
                      {isCurrentlyOverdue && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fbebe4] text-[#d64f1c] text-[11px] font-bold border border-[#f4c6b2]">
                          <AlertTriangle className="w-3 h-3" />
                          <span>逾期待還</span>
                        </span>
                      )}
                      {isReturned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#f0f4f0] text-[#556e62] text-[11px] font-bold border border-[#d6e2d8]">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>已歸還存查</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fae8e8] text-[#b82d2d] text-[11px] font-bold border border-[#f5c6c6]">
                          <Ban className="w-3 h-3" />
                          <span>已駁回申請</span>
                        </span>
                      )}

                      {/* Category Tag (依照項目類別進行歸納) */}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#eff4ef] text-[#3c594b] text-[11px] font-semibold border border-[#d4e2d6]">
                        <FolderKanban className="w-3 h-3 text-[#547a6b]" />
                        <span>{record.categoryName || '項目系列'}</span>
                        {record.subCategory && (
                          <span className="text-[#6d8a7c] font-normal">
                            · {record.subCategory}
                          </span>
                        )}
                      </span>

                      {/* Single Application ID */}
                      <span className="font-mono text-xs font-bold text-[#557062] bg-[#f4f7f3] px-2 py-0.5 rounded-lg border border-[#e1eae0]">
                        {record.id}
                      </span>

                      {/* Apply Date */}
                      <span className="text-[11px] text-[#869b8f] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>申請日期：{record.borrowDate}</span>
                      </span>
                    </div>

                    {/* Product & Variant Title */}
                    <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-[#edf3ed] font-extrabold text-[#547a6b] font-mono text-xs border border-[#d4e4d6]">
                          {record.modelCode}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md bg-[#fbebe4] font-bold text-[#e25b24] font-mono text-xs border border-[#f4cfbf]">
                          {record.skuCode}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-[#2d4237]">
                        {record.modelName}
                      </h4>
                      <span className="text-xs text-[#5b7367] font-medium bg-[#f5f8f4] px-2 py-0.5 rounded-md border border-[#e2ece2] shrink-0">
                        {record.variantName}
                      </span>
                    </div>

                    {/* Details Row: Borrower, Department, Quantity, Purpose, Notes */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs text-[#4b6457] pt-1">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#547a6b] shrink-0" />
                        <span className="font-semibold text-[#2d4237]">{record.borrower}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#547a6b] shrink-0" />
                        <span className="text-[#556f61]">{record.department}</span>
                      </div>

                      <div>
                        <span className="text-[#728b7e]">借調數量：</span>
                        <strong className="text-[#2d4237] font-bold font-mono">{record.quantity}</strong>
                        <span className="text-[#728b7e] ml-0.5">件</span>
                      </div>

                      <div>
                        <span className="text-[#728b7e]">用途：</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#eff4ee] text-[#3d5a4c] font-medium text-[11px] border border-[#d9e5da]">
                          {record.purpose}
                        </span>
                      </div>
                    </div>

                    {record.notes && (
                      <div className="mt-2 text-[11px] text-[#637d70] bg-[#f8faf8] px-2.5 py-1 rounded-xl border border-[#edf3ed]">
                        <span className="font-medium text-[#465f52]">申請備註：</span>
                        {record.notes}
                      </div>
                    )}

                    {record.auditComment && (
                      <div className="mt-1.5 text-[11px] text-[#914646] bg-[#fff5f5] px-2.5 py-1 rounded-xl border border-[#fae2e2]">
                        <span className="font-semibold">駁回備註：</span>
                        {record.auditComment}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Return Due Date & Action Buttons */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-2.5 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#edf2ec] shrink-0">
                    <div className="text-left lg:text-right">
                      <span className="text-[11px] text-[#71877c] block">
                        {isReturned ? '歸還完成' : '預計應歸還日'}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold ${
                          isCurrentlyOverdue ? 'text-[#e25b24]' : 'text-[#2d4237]'
                        }`}
                      >
                        {record.expectedReturnDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-end">
                      {/* Workflow 1: 待審核狀態下的審批動作 (管理者專屬) */}
                      {isPendingReview && (
                        <>
                          {isAdmin ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setRecordToReject(record)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-[#fae8e8] text-[#b82d2d] border border-[#f5c6c6] text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
                                title="駁回此筆借調申請"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>駁回</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => onApproveBorrow(record.id)}
                                className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95"
                                title="確認核准此筆樣品借出並鎖定庫存"
                              >
                                <CheckCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>核准出借</span>
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={onOpenAdminLogin}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#fff4e8] hover:bg-[#ffebd6] text-[#b85400] border border-[#f8cca3] text-xs font-medium transition-colors cursor-pointer"
                              title="需管理者密碼審批"
                            >
                              <Lock className="w-3 h-3 text-[#ff7a29]" />
                              <span>需管理者核准</span>
                            </button>
                          )}
                        </>
                      )}

                      {/* Workflow 2: 借用中狀態的登記歸還動作 */}
                      {(isCurrentlyActive || isCurrentlyOverdue) && (
                        <button
                          type="button"
                          onClick={() => onReturnItem(record.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-95 shrink-0"
                          title="確認樣品已歸還入庫，解除庫存預扣"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>登記歸還</span>
                        </button>
                      )}

                      {/* 檢視規格連動按鈕 */}
                      <button
                        type="button"
                        onClick={() => onNavigateToItem(record.modelCode, record.skuCode)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#eff4ee] hover:bg-[#e2ebe0] text-[#3d5c4d] text-xs font-medium border border-[#d3ded2] transition-colors cursor-pointer shrink-0"
                        title="在樣品庫存清單中檢視此型號詳細規格"
                      >
                        <span>檢視規格</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      {/* 刪除借調單按鈕 (管理者專屬) */}
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => setRecordToDelete(record)}
                          className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 border border-[#e2ece2] text-[#7e9588] hover:text-[#c0392b] hover:bg-[#fbeee9] hover:border-[#f3c8bf]"
                          title={`刪除此筆借調單【${record.id}】`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline ml-1">刪除</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Reject Reason Confirmation Modal */}
      {recordToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#dce5dc] relative">
            <button
              onClick={() => setRecordToReject(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#6f877b] hover:bg-[#edf2ec] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#fae8e8] text-[#b82d2d] flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2d4237]">駁回借調申請單</h3>
                <p className="text-xs text-[#71877c] mt-0.5">單號：{recordToReject.id}</p>
              </div>
            </div>

            <div className="p-3 bg-[#f8faf7] rounded-xl border border-[#e2eae1] text-xs text-[#486355] mb-3 space-y-1">
              <div>申請人：<strong>{recordToReject.borrower} ({recordToReject.department})</strong></div>
              <div>借用品項：{recordToReject.modelCode} - {recordToReject.skuCode} ({recordToReject.variantName})</div>
              <div>借調數量：{recordToReject.quantity} 件</div>
            </div>

            <div className="space-y-1.5 mb-4">
              <label className="block text-xs font-semibold text-[#486355]">
                請輸入駁回原因說明
              </label>
              <input
                type="text"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="例如: 門市展演排程衝突，現存樣品在庫不足"
                className="w-full px-3 py-2 text-xs bg-white border border-[#cad8cb] rounded-xl focus:outline-hidden"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRecordToReject(null)}
                className="px-4 py-2 rounded-full text-xs font-medium text-[#5c7367] hover:bg-[#edf2ec] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-full bg-[#b82d2d] hover:bg-[#a12323] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                確認駁回申請
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-2xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#dce5dc] relative">
            <button
              onClick={() => setRecordToDelete(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#6f877b] hover:bg-[#edf2ec] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#fbebe4] text-[#d64f1c] flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2d4237]">確認刪除此借調紀錄？</h3>
                <p className="text-xs text-[#71877c] mt-0.5">單號：{recordToDelete.id}</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#f8faf7] rounded-2xl border border-[#dfe8df] text-xs text-[#3a5246] space-y-1.5 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[#6d8477]">系列類別：</span>
                <span className="font-semibold text-[#547a6b]">{recordToDelete.categoryName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6d8477]">品項規格：</span>
                <span className="font-semibold text-[#2d4237]">
                  {recordToDelete.modelCode} - {recordToDelete.skuCode} ({recordToDelete.variantName})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6d8477]">借調人員：</span>
                <span className="font-medium text-[#2d4237]">
                  {recordToDelete.borrower} ({recordToDelete.department})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#6d8477]">當前狀態：</span>
                <span className="font-bold text-[#2d4237]">{recordToDelete.status}</span>
              </div>
            </div>

            {recordToDelete.status === '借用中' && (
              <div className="p-3 rounded-xl bg-[#eff6f0] border border-[#cbe1d0] text-[11px] text-[#3e6050] flex items-start gap-2 mb-4 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-[#547a6b] shrink-0 mt-0.5" />
                <span>
                  <strong>在庫同步更新說明</strong>：此單據目前為「借用中」，確認刪除後系統將自動解除在庫預扣（+{recordToDelete.quantity} 件），回補至可用庫存量。
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-4 py-2 rounded-full text-xs font-medium text-[#5c7367] hover:bg-[#edf2ec] transition-colors cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 rounded-full bg-[#d64f1c] hover:bg-[#bf4113] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>確認刪除單據</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
