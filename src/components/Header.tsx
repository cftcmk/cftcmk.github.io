import React from 'react';
import {
  FileText,
  Plus,
  Bell,
  ShieldCheck,
  Lock,
  ClipboardList,
  KeyRound,
  LogOut,
  Sheet,
  ExternalLink,
  Share2,
} from 'lucide-react';
import { UserRole } from './RolePermissionModal';

interface HeaderProps {
  activeTab: 'inventory' | 'new_notices' | 'borrow_status' | 'admin_login';
  onTabChange: (tab: 'inventory' | 'new_notices' | 'borrow_status' | 'admin_login') => void;
  onQuickRent: () => void;
  onAddNew: () => void;
  unreadNoticesCount?: number;
  unreadTotalQuantity?: number;
  activeBorrowsCount?: number;
  pendingBorrowsCount?: number;
  currentRole: UserRole;
  currentUserName?: string;
  unreadApplicationsCount?: number;
  onOpenPermissionModal: () => void;
  onOpenInstallModal?: () => void;
  onOpenAdminPasswordModal: () => void;
  onLockToViewer: () => void;
  onOpenAuditLogsModal?: () => void;
  onLogout?: () => void;
  isSheetsConnected?: boolean;
  isSheetsSyncing?: boolean;
  onConnectGoogleSheets?: () => void;
  sheetsSpreadsheetUrl?: string;
  onShare?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onQuickRent,
  onAddNew,
  unreadNoticesCount = 0,
  unreadTotalQuantity = 0,
  activeBorrowsCount = 0,
  pendingBorrowsCount = 0,
  currentRole,
  currentUserName,
  unreadApplicationsCount = 0,
  onOpenPermissionModal,
  onOpenInstallModal,
  onOpenAdminPasswordModal,
  onLockToViewer,
  onOpenAuditLogsModal,
  onLogout,
  isSheetsConnected = false,
  isSheetsSyncing = false,
  onConnectGoogleSheets,
  sheetsSpreadsheetUrl,
  onShare,
}) => {
  return (
    <header className="w-full flex flex-col sm:flex-row items-center justify-between py-2.5 sm:py-3.5 px-3 sm:px-6 gap-2.5 sm:gap-4 select-none bg-[#edf2ec] transition-colors border-b border-[#dfe7df]">
      {/* Brand Title & Mobile Action Buttons */}
      <div className="w-full sm:w-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <h1 className="text-base sm:text-lg font-semibold tracking-wide text-[#334a41] whitespace-nowrap">
            CFD 行銷企劃課
          </h1>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#e0eae1] text-[#446654] font-bold whitespace-nowrap shrink-0">
            <span className="inline sm:hidden">{currentRole === 'admin' ? '管理者後台' : '訪客唯讀'}</span>
            <span className="hidden sm:inline">{currentRole === 'admin' ? '庫存管理後台 (管理者)' : '樣品展示 (訪客唯讀)'}</span>
          </span>
        </div>

        {/* Mobile Action Buttons (< sm screens): Compact Icon-only format to prevent crowding */}
        <div className="flex sm:hidden items-center gap-1.5 shrink-0">
          {/* Google Sheets Sync Indicator (Mobile: Icon only) */}
          {onConnectGoogleSheets && (
            <button
              onClick={onConnectGoogleSheets}
              className={`relative flex items-center justify-center w-8 h-8 rounded-full border shadow-2xs cursor-pointer shrink-0 transition-colors ${
                isSheetsConnected
                  ? 'bg-[#e4f1e8] border-[#bedbc6] text-[#2c5f40] hover:bg-[#d8ecdc]'
                  : 'bg-white border-[#cad8cb] text-[#4d6658] hover:bg-[#f1f6f2]'
              }`}
              title={
                isSheetsSyncing
                  ? 'Google 試算表同步中...'
                  : isSheetsConnected
                  ? 'Google 試算表已連動（點擊進行同步）'
                  : '串接 Google 試算表'
              }
              aria-label="Google 試算表"
            >
              <Sheet className="w-4 h-4 text-[#2e7d32]" />
              <span
                className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                  isSheetsSyncing ? 'bg-[#ff9800] animate-ping' : isSheetsConnected ? 'bg-[#2e7d32]' : 'bg-[#9e9e9e]'
                }`}
              />
            </button>
          )}

          {/* 分享此網站 (Mobile: Icon only) */}
          {onShare && (
            <button
              onClick={onShare}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white hover:bg-[#f1f6f2] text-[#425d50] border border-[#cad8cb] shadow-2xs transition-colors cursor-pointer shrink-0"
              title="分享此網站"
              aria-label="分享此網站"
            >
              <Share2 className="w-4 h-4 text-[#547a6b]" />
            </button>
          )}

          {/* 快速租借 (Mobile: Icon only) */}
          <button
            onClick={onQuickRent}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-[#93b7b2] hover:bg-[#82a8a3] text-white transition-colors shadow-2xs cursor-pointer shrink-0"
            title="快速租借"
            aria-label="快速租借"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* 新增品項 / 密碼解鎖 (Mobile: Icon only) */}
          {currentRole === 'admin' ? (
            <button
              onClick={onAddNew}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#93b7b2] hover:bg-[#82a8a3] text-white transition-colors shadow-2xs cursor-pointer shrink-0"
              title="新增品項"
              aria-label="新增品項"
            >
              <Plus className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onOpenAdminPasswordModal}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f3ede4] text-[#b85a1a] border border-[#e5d2be] hover:bg-[#eae1d5] transition-colors shadow-2xs cursor-pointer shrink-0"
              title="輸入密碼解鎖管理員編輯權限"
              aria-label="解鎖管理員編輯權限"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          )}

          {/* 後台管理 / 管理者登入 (Mobile: Icon only) */}
          <button
            onClick={
              currentRole === 'admin'
                ? onOpenPermissionModal
                : onOpenAdminPasswordModal
            }
            className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all shadow-2xs cursor-pointer border shrink-0 ${
              currentRole === 'admin'
                ? 'bg-[#e4ede5] border-[#c7d9c8] text-[#335645] hover:bg-[#d8e4da]'
                : 'bg-[#e8f1e9] border-[#bdd4c0] text-[#2c4e3b] hover:bg-[#d8e6da]'
            }`}
            title={currentRole === 'admin' ? '管理者後台權限設定' : '管理者登入 (解鎖管理權限)'}
            aria-label={currentRole === 'admin' ? '管理者後台' : '管理者登入'}
          >
            {currentRole === 'admin' ? (
              <ShieldCheck className="w-4 h-4 text-[#4e7966]" />
            ) : (
              <Lock className="w-3.5 h-3.5 text-[#3b6b52]" />
            )}
            {unreadApplicationsCount > 0 && currentRole === 'admin' && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#ff5722] ring-2 ring-white" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs: 庫存清單 & 新品通知 & 租借狀況 */}
      <nav className="flex items-center justify-center gap-1.5 sm:gap-2 shrink-0 py-1 sm:py-1.5 overflow-visible">
        <button
          onClick={() => onTabChange('inventory')}
          className={`flex-1 sm:flex-initial px-3.5 sm:px-5 py-1.5 text-xs sm:text-sm font-medium rounded-full text-center transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === 'inventory'
              ? 'bg-white text-[#2c4038] shadow-xs font-semibold'
              : 'text-[#5d7369] hover:text-[#2c4038] hover:bg-black/5'
          }`}
        >
          庫存清單
        </button>

        <button
          onClick={() => onTabChange('new_notices')}
          className={`relative flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-1.5 text-xs sm:text-sm font-medium rounded-full text-center transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === 'new_notices'
              ? 'bg-white text-[#2c4038] shadow-xs font-semibold'
              : 'text-[#5d7369] hover:text-[#2c4038] hover:bg-black/5'
          }`}
          title={
            unreadNoticesCount > 0
              ? `新品通知：共 ${unreadNoticesCount} 項新品入庫${unreadTotalQuantity > 0 ? ` (累計 +${unreadTotalQuantity} 件樣品)` : ''}`
              : '新品通知與樣品動態'
          }
        >
          <Bell className="w-3.5 h-3.5 text-[#739a85]" />
          <span>新品通知</span>
          {unreadNoticesCount > 0 && (
            <span className="absolute -top-1 -right-1 sm:-right-1.5 flex items-center justify-center pointer-events-none z-20">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#ff4d2e]/40 animate-ping opacity-65" />
              <span className="relative inline-flex items-center justify-center min-w-[17px] h-[17px] sm:min-w-[18px] sm:h-[18px] px-1 rounded-full bg-gradient-to-r from-[#ff4500] to-[#ff5722] text-white text-[9px] sm:text-[10px] font-black shadow-sm ring-1 ring-white animate-breathing leading-none">
                {unreadNoticesCount > 99 ? '99+' : unreadNoticesCount}
              </span>
            </span>
          )}
        </button>

        {/* 租借狀況 按鈕 */}
        <button
          onClick={() => onTabChange('borrow_status')}
          className={`relative flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-1.5 text-xs sm:text-sm font-medium rounded-full text-center transition-all duration-200 cursor-pointer whitespace-nowrap ${
            activeTab === 'borrow_status'
              ? 'bg-white text-[#2c4038] shadow-xs font-semibold'
              : 'text-[#5d7369] hover:text-[#2c4038] hover:bg-black/5'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5 text-[#547a6b]" />
          <span>租借狀況</span>
          {pendingBorrowsCount > 0 ? (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#ff7a29] text-white text-[10px] font-black shadow-2xs leading-none animate-pulse">
              {pendingBorrowsCount} 待審
            </span>
          ) : activeBorrowsCount > 0 ? (
            <span className="inline-flex items-center justify-center min-w-[17px] h-[17px] px-1 rounded-full bg-[#547a6b] text-white text-[10px] font-bold shadow-2xs leading-none">
              {activeBorrowsCount}
            </span>
          ) : null}
        </button>
      </nav>

      {/* Desktop Right Action Buttons */}
      <div className="hidden sm:flex items-center gap-2 sm:gap-2.5">
        {/* Google Sheets Sync Button */}
        {onConnectGoogleSheets && (
          <div className="flex items-center gap-1">
            <button
              onClick={onConnectGoogleSheets}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shadow-2xs cursor-pointer shrink-0 border ${
                isSheetsConnected
                  ? 'bg-[#e7f3ec] border-[#b8ddc4] text-[#2d6143] hover:bg-[#d9ede0]'
                  : 'bg-white border-[#d0ded2] text-[#4d6657] hover:bg-[#f2f7f3]'
              }`}
              title={
                isSheetsConnected
                  ? '已連動 Google 試算表（點擊進行即時同步）'
                  : '點擊登入 Google 帳號以串接 Google 試算表'
              }
            >
              <Sheet className={`w-3.5 h-3.5 ${isSheetsConnected ? 'text-[#2e7d32]' : 'text-[#547a6b]'}`} />
              <span className={`w-1.5 h-1.5 rounded-full ${isSheetsSyncing ? 'bg-[#ff9800] animate-ping' : isSheetsConnected ? 'bg-[#2e7d32]' : 'bg-[#9e9e9e]'}`} />
              <span>{isSheetsSyncing ? '同步中...' : isSheetsConnected ? 'Google 試算表' : '串接試算表'}</span>
            </button>
            {isSheetsConnected && sheetsSpreadsheetUrl && (
              <a
                href={sheetsSpreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-full text-[#547a6b] hover:bg-[#e2ede4] transition-colors cursor-pointer"
                title="在 Google 試算表中開啟"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {/* 分享此網站 (Desktop) */}
        {onShare && (
          <button
            onClick={onShare}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-white hover:bg-[#f1f6f2] text-[#3d594c] border border-[#cad8cb] text-xs font-semibold transition-colors shadow-2xs cursor-pointer shrink-0"
            title="分享此網站連結給同仁或合作夥伴"
          >
            <Share2 className="w-3.5 h-3.5 text-[#547a6b]" />
            <span>分享網站</span>
          </button>
        )}

        <button
          onClick={onQuickRent}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-[#93b7b2] hover:bg-[#82a8a3] text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>快速租借</span>
        </button>

        {/* 新增品項按鈕 (管理者可新增；檢視者點擊會觸發密碼輸入) */}
        <button
          onClick={currentRole === 'admin' ? onAddNew : onOpenAdminPasswordModal}
          className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer shrink-0 ${
            currentRole === 'admin'
              ? 'bg-[#93b7b2] hover:bg-[#82a8a3]'
              : 'bg-[#b6aba0] hover:bg-[#a5998e]'
          }`}
          title={currentRole === 'admin' ? '新增產品型號規格 (管理者專用)' : '點擊輸入密碼以解鎖管理權限'}
        >
          {currentRole === 'admin' ? (
            <Plus className="w-3.5 h-3.5" />
          ) : (
            <Lock className="w-3 h-3 text-white" />
          )}
          <span>新增品項</span>
        </button>

        {/* 權限身分標籤與切換 */}
        {currentRole === 'admin' ? (
          <div className="flex items-center bg-[#e4ede5] border border-[#c7d9c8] rounded-full p-0.5 shadow-2xs">
            <button
              onClick={onOpenPermissionModal}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-[#335645] hover:bg-[#d8e6da] transition-colors cursor-pointer"
              title="管理者中心 (Paul Wang)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#4e7966]" />
              <span>管理者 ({currentUserName || 'Paul Wang'})</span>
              {unreadApplicationsCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[15px] h-[15px] px-1 rounded-full bg-[#ff4d2e] text-white text-[9px] font-black leading-none animate-pulse">
                  {unreadApplicationsCount}
                </span>
              )}
            </button>
            <button
              onClick={onLockToViewer}
              className="p-1 px-2 rounded-full text-[11px] text-[#698878] hover:text-[#9e3a2b] hover:bg-[#fae6e4] transition-colors cursor-pointer flex items-center gap-1"
              title="鎖定並退出為一般檢視者模式"
            >
              <LogOut className="w-3 h-3" />
              <span>鎖定</span>
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAdminPasswordModal}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer border bg-[#e8f1e9] hover:bg-[#d8e6da] border-[#bdd4c0] text-[#2c4e3b]"
            title="管理者登入 (解鎖新增、編輯與刪除管理權限)"
          >
            <Lock className="w-3.5 h-3.5 text-[#3b6b52]" />
            <span>管理者登入</span>
          </button>
        )}
      </div>
    </header>
  );
};
