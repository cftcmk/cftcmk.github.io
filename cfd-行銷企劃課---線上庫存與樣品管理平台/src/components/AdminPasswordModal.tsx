import React, { useState } from 'react';
import { X, KeyRound, ShieldCheck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL } from './RolePermissionModal';

export const MASTER_ADMIN_PASSWORDS = ['cfd0000', '0000', 'cfd8827', 'admin8827', 'paulwang8827'];

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const trimmed = password.trim();

    if (MASTER_ADMIN_PASSWORDS.includes(trimmed.toLowerCase())) {
      onSuccess();
      setPassword('');
      onClose();
    } else {
      setErrorMsg('密碼錯誤：請輸入正確的管理者安全密碼');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#dce5dc] relative animate-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#6f877b] hover:bg-[#edf2ec] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#eff5ef] text-[#547a6b] flex items-center justify-center border border-[#d2e4d4]">
            <KeyRound className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#2d4237]">管理者身分密碼驗證</h3>
            <p className="text-xs text-[#71877c] mt-0.5">
              請輸入密碼以解鎖庫存管理後台與編輯審批權限
            </p>
          </div>
        </div>

        {/* Master Admin Identity Note */}
        <div className="p-3.5 bg-[#f8faf7] rounded-2xl border border-[#dfe8df] text-xs text-[#486355] mb-4 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[#6d8477]">授權管理者：</span>
            <strong className="text-[#2d4237]">{SUPER_ADMIN_NAME}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#6d8477]">管理者信箱：</span>
            <span className="font-mono text-[#527061]">{SUPER_ADMIN_EMAIL}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#455f52] mb-1.5">
              請輸入管理安全密碼
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="請輸入密碼"
                className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-[#cad8cb] rounded-xl text-xs text-[#2d4237] focus:outline-hidden focus:border-[#547a6b] transition-colors"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7f978a] hover:text-[#2d4237] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errorMsg && (
              <p className="text-[11px] text-[#c0392b] font-medium mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-[#5c7367] hover:bg-[#edf2ec] transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-full bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>確認解鎖管理權限</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
