import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export const AuthPortal: React.FC = () => {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('行銷企劃課');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('請輸入電子郵件與密碼');
      return;
    }

    if (mode === 'register' && !name.trim()) {
      setErrorMsg('請輸入使用者姓名');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password.trim());
      } else {
        await register(email.trim(), password.trim(), name.trim(), department.trim());
        setSuccessMsg('帳號註冊成功，已為您自動登入！');
      }
    } catch (err: any) {
      setErrorMsg(err.message || '連線或驗證失敗，請檢查網路連線後再試一次');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf2ec] text-[#2c3e35] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e2ede4] border border-[#cbd9cd] text-[#406453] text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4e7966]" />
          <span>CFD 行銷企劃課 • 正式商用庫存管理系統</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#2d4237] tracking-tight">
          樣品庫存管理作業平台
        </h1>
        <p className="text-xs sm:text-sm text-[#6c8276] mt-1.5 max-w-md mx-auto">
          依商用 SaaS 安全規範，受保護系統需先通過使用者帳號認證後方可進行在庫檢視與管理操作。
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#dbe6db] relative animate-in fade-in zoom-in-95 duration-200">
        {/* Mode Selector Tabs */}
        <div className="flex bg-[#f2f6f2] p-1 rounded-2xl mb-6 border border-[#e1ece1]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-white text-[#2d4237] shadow-xs'
                : 'text-[#6c8376] hover:text-[#2d4237]'
            }`}
          >
            登入系統 (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-white text-[#2d4237] shadow-xs'
                : 'text-[#6c8376] hover:text-[#2d4237]'
            }`}
          >
            註冊新同仁 (Register)
          </button>
        </div>

        {/* Error / Success Feedback */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#fdf2f0] border border-[#f5c6cb] text-[#c0392b] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#eff8f1] border border-[#c3e6cb] text-[#276e3e] text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#405a4d] mb-1">同仁姓名</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7c9789]">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：林專員"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#fbfdfb] border border-[#c9d8cb] rounded-xl text-xs text-[#2d4237] focus:outline-hidden focus:border-[#4e7966] focus:ring-1 focus:ring-[#4e7966]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#405a4d] mb-1">所屬部門</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7c9789]">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#fbfdfb] border border-[#c9d8cb] rounded-xl text-xs text-[#2d4237] focus:outline-hidden focus:border-[#4e7966]"
                  >
                    <option value="行銷企劃課">行銷企劃課</option>
                    <option value="業務一部">業務一部</option>
                    <option value="業務二部">業務二部</option>
                    <option value="品保研發課">品保研發課</option>
                    <option value="展覽工程部">展覽工程部</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#405a4d] mb-1">電子郵件信箱 (Email)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7c9789]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="例如：paulwang8827@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 bg-[#fbfdfb] border border-[#c9d8cb] rounded-xl text-xs text-[#2d4237] focus:outline-hidden focus:border-[#4e7966] focus:ring-1 focus:ring-[#4e7966]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#405a4d] mb-1">密碼 (Password)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7c9789]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                className="w-full pl-9 pr-10 py-2.5 bg-[#fbfdfb] border border-[#c9d8cb] rounded-xl text-xs text-[#2d4237] focus:outline-hidden focus:border-[#4e7966] focus:ring-1 focus:ring-[#4e7966]"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#7c9789] hover:text-[#2d4237] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-[#547a6b] hover:bg-[#436457] text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>正在驗證身分中...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>{mode === 'login' ? '登入進入庫存管理後台' : '建立帳號並登入'}</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security & RBAC Footer */}
        <div className="mt-6 pt-4 border-t border-[#eaf0ea] text-[11px] text-[#718b7c] space-y-1 text-center">
          <p className="flex items-center justify-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-[#547a6b]" />
            <span>依身分角色實施權限隔離（Admin / Manager / User）</span>
          </p>
          <p>所有新增、修改、刪除操作均透過資料庫 Transaction 與稽核記錄保護。</p>
        </div>
      </div>
    </div>
  );
};
