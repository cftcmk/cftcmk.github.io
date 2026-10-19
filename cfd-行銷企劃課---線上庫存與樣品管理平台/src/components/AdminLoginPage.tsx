import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  Lock,
  Sheet,
  CheckCircle2,
} from 'lucide-react';
import { SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL } from './RolePermissionModal';

export const MASTER_ADMIN_PASSWORDS = ['cfd0000', '0000', 'cfd8827', 'admin8827', 'paulwang8827'];

interface AdminLoginPageProps {
  onSuccess: () => void;
  onCancel: () => void;
  isSheetsConnected?: boolean;
  onConnectGoogleSheets?: () => void;
  isSheetsSyncing?: boolean;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onSuccess,
  onCancel,
  isSheetsConnected = false,
  onConnectGoogleSheets,
  isSheetsSyncing = false,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = password.trim();

    if (!trimmed) {
      setErrorMsg('請輸入管理者密碼');
      return;
    }

    setIsSubmitting(true);
    // Verify password (default: cfd0000)
    if (MASTER_ADMIN_PASSWORDS.includes(trimmed.toLowerCase())) {
      onSuccess();
    } else {
      setIsSubmitting(false);
      setErrorMsg('密碼不正確，請重新輸入');
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center justify-center px-4 py-8">
      {/* Return to Visitor mode button */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs text-[#526f60] hover:text-[#2d4237] transition-colors cursor-pointer font-medium py-1 px-2.5 rounded-lg hover:bg-white/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>返回前台樣品清單 (訪客唯讀模式)</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-9 shadow-lg border border-[#dce5dc] relative animate-in fade-in zoom-in-95 duration-200">
        {/* Brand & Title */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#eff5ef] text-[#4e7966] flex items-center justify-center border border-[#d2e4d4] shadow-2xs mb-3.5">
            <KeyRound className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2d4237] tracking-tight">
            庫存管理後台登入
          </h2>
          <p className="text-xs text-[#6e8578] mt-1 leading-relaxed">
            此後台僅限授權管理人員進入，請輸入管理密碼以解鎖編輯權限
          </p>
        </div>

        {/* Authorized Admin Identity Pill */}
        <div className="p-3.5 bg-[#f6faf6] rounded-2xl border border-[#d9e8da] text-xs text-[#436352] mb-6 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[#6d8477]">系統授權管理者</span>
            <strong className="text-[#2d4237] font-semibold">{SUPER_ADMIN_NAME}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6d8477]">管理帳號信箱</span>
            <span className="font-mono text-[#4e7966] text-[11px] font-medium">{SUPER_ADMIN_EMAIL}</span>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#3d5648] mb-1.5">
              後台管理安全密碼
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7d978a]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="請輸入密碼"
                className="w-full pl-10 pr-10 py-3 bg-[#fbfdfb] border border-[#cbd9cc] rounded-xl text-xs sm:text-sm text-[#2d4237] placeholder:text-[#a0b5a8] focus:outline-hidden focus:bg-white focus:border-[#4e7966] focus:ring-2 focus:ring-[#4e7966]/20 transition-all"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7d978a] hover:text-[#2d4237] cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {errorMsg && (
              <div className="text-[11px] text-[#c0392b] font-medium mt-2 flex items-center gap-1.5 p-2 bg-[#fdf0ee] rounded-lg border border-[#f5c6cb]">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-[#547a6b] hover:bg-[#436457] text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-75"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>進入庫存管理後台</span>
            </button>
          </div>
        </form>

        {/* Google Sheets Connection Option */}
        {onConnectGoogleSheets && (
          <div className="mt-6 pt-5 border-t border-[#e5ede4]">
            <div className="text-center mb-3">
              <span className="text-[11px] text-[#718a7c]">或連動 Google 雲端試算表</span>
            </div>
            <button
              type="button"
              onClick={onConnectGoogleSheets}
              className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs ${
                isSheetsConnected
                  ? 'bg-[#e7f3ec] border-[#b6ddc3] text-[#2b6140] hover:bg-[#d8eedf]'
                  : 'bg-white border-[#cad7cb] text-[#425e4f] hover:bg-[#f3f7f3]'
              }`}
            >
              <Sheet className="w-4 h-4 text-[#2e7d32]" />
              <span>
                {isSheetsSyncing
                  ? '正在同步試算表資料...'
                  : isSheetsConnected
                  ? 'Google 試算表已連動（點擊重新同步）'
                  : '以 Google 帳號連動試算表'}
              </span>
            </button>
          </div>
        )}

        {/* Feature summary */}
        <div className="mt-6 pt-4 border-t border-[#eef3ee] text-[11px] text-[#7b9184] text-center space-y-1">
          <p>✔ 進入後台可直接新增品項、編輯在庫與刪除規格</p>
          <p>✔ 資料即時雙向同步 Google 試算表，重新整理不遺失</p>
        </div>
      </div>
    </div>
  );
};
