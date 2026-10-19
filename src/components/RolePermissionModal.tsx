import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  UserCheck,
  Check,
  XCircle,
  AlertCircle,
  User,
  Send,
  Lock,
  Crown,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer';

export interface RoleApplication {
  id: string;
  applicantName: string;
  email: string;
  department: string;
  requestedRole: 'admin';
  reason: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export const SUPER_ADMIN_EMAIL = 'paulwang8827@gmail.com';
export const SUPER_ADMIN_NAME = 'Paul Wang';

interface RolePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  currentUser: { name: string; email: string };
  onSwitchRole: (role: UserRole) => void;
  onLoginAsAdmin: (email: string) => boolean;
  onSwitchToVisitor: () => void;
  applications: RoleApplication[];
  onApproveApplication: (id: string) => void;
  onRejectApplication: (id: string) => void;
  onSubmitApplication: (name: string, email: string, department: string, reason: string) => void;
  approvedAdminEmails: string[];
}

export const RolePermissionModal: React.FC<RolePermissionModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  currentUser,
  onSwitchRole,
  onLoginAsAdmin,
  onSwitchToVisitor,
  applications,
  onApproveApplication,
  onRejectApplication,
  onSubmitApplication,
  approvedAdminEmails,
}) => {
  const [applyName, setApplyName] = useState('');
  const [applyEmail, setApplyEmail] = useState('');
  const [applyDept, setApplyDept] = useState('行銷企劃課');
  const [applyReason, setApplyReason] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);

  // Admin login input
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [loginError, setLoginError] = useState('');

  if (!isOpen) return null;

  const isSuperAdminUser = currentUser.email.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyName.trim() || !applyReason.trim() || !applyEmail.trim()) return;
    onSubmitApplication(
      applyName.trim(),
      applyEmail.trim(),
      applyDept.trim(),
      applyReason.trim()
    );
    setApplyName('');
    setApplyEmail('');
    setApplyReason('');
    setShowApplyForm(false);
  };

  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = onLoginAsAdmin(adminEmailInput.trim());
    if (success) {
      setShowAdminLogin(false);
      setAdminEmailInput('');
    } else {
      setLoginError('驗證失敗：此電子郵件非最高管理者或尚未獲得授權。');
    }
  };

  const pendingApps = applications.filter((a) => a.status === 'pending');
  const historyApps = applications.filter((a) => a.status !== 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl p-5 sm:p-8 shadow-2xl border border-[#dce5dc] relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#6f877b] hover:bg-[#edf2ec] transition-colors cursor-pointer"
          title="關閉"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-[#edf2ec]">
          <div className="w-11 h-11 rounded-2xl bg-[#eff3ee] text-[#547a6b] flex items-center justify-center shadow-2xs border border-[#dce5dc]">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-[#2d4237]">
              權限與人員審批中心
            </h3>
            <p className="text-xs text-[#71877c] mt-0.5">
              平台由管理者 Paul Wang 專屬管理。任何獲取連結之人員嚴格預設為唯讀檢視者。
            </p>
          </div>
        </div>

        {/* Platform Master Administrator Card */}
        <div className="p-4 bg-gradient-to-r from-[#eff5f0] to-[#e4ece3] rounded-2xl border border-[#c9dccb] mb-5 shadow-2xs">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#547a6b] text-white flex items-center justify-center font-black text-sm shadow-xs ring-2 ring-white">
                PW
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[#243a30] text-sm sm:text-base">
                    {SUPER_ADMIN_NAME}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#547a6b] text-white shadow-2xs">
                    <Crown className="w-3 h-3" />
                    <span>最高系統管理者</span>
                  </span>
                </div>
                <span className="text-xs text-[#527062] font-mono font-medium">
                  {SUPER_ADMIN_EMAIL}
                </span>
              </div>
            </div>
          </div>
          <div className="text-[11px] text-[#476556] leading-relaxed pt-2 border-t border-[#d4e4d5]/80 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-[#547a6b] shrink-0" />
            <span>
              <strong>唯一最高權限</strong>：具備全站品項新增、在席盤點維護、照片更新與人員授權審批資格。
            </span>
          </div>
        </div>

        {/* Current Active Session Status Card */}
        <div className="p-4 bg-[#f8faf7] rounded-2xl border border-[#dfe7de] mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
            <div>
              <span className="text-[11px] font-semibold text-[#6e8578] block">當前瀏覽身分</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-bold text-[#2d4237] text-sm">{currentUser.name}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    currentRole === 'admin'
                      ? 'bg-[#547a6b] text-white'
                      : 'bg-[#98bdb9] text-white'
                  }`}
                >
                  {currentRole === 'admin' ? '管理者模式 (可編輯)' : '一般檢視者 (唯讀限制)'}
                </span>
              </div>
              <span className="text-[11px] text-[#71877c] font-mono">{currentUser.email}</span>
            </div>

            {/* Quick Switch for Super Admin Paul Wang */}
            {isSuperAdminUser ? (
              <div className="flex items-center bg-white p-1 rounded-xl border border-[#d6e0d5] text-xs self-start sm:self-auto shadow-2xs">
                <button
                  type="button"
                  onClick={() => onSwitchRole('admin')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    currentRole === 'admin'
                      ? 'bg-[#547a6b] text-white shadow-2xs'
                      : 'text-[#5d7369] hover:text-[#2c4038]'
                  }`}
                >
                  管理者模式
                </button>
                <button
                  type="button"
                  onClick={() => onSwitchRole('viewer')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    currentRole === 'viewer'
                      ? 'bg-[#98bdb9] text-white shadow-2xs'
                      : 'text-[#5d7369] hover:text-[#2c4038]'
                  }`}
                  title="切換至一般訪客視角測試體驗"
                >
                  訪客視角 (唯讀)
                </button>
              </div>
            ) : (
              /* Non-admin Visitor controls */
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-[#edf2ec] text-[#425d50] text-xs font-semibold border border-[#cadacb] shadow-2xs transition-all cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-[#547a6b]" />
                  <span>管理者本人登入</span>
                </button>
              </div>
            )}
          </div>

          <div className="text-[11px] text-[#556e62] pt-2 border-t border-[#e5ece3] flex items-center gap-1.5">
            {currentRole === 'admin' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>您目前擁有編輯、新增、刪除、上傳照片與審核權限。</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-[#d05c38] shrink-0" />
                <span className="text-[#a54224] font-medium">
                  唯讀限制中：無新增品項、編輯庫存及上傳照片權限。未獲管理者批准前無法修改資料。
                </span>
              </>
            )}
          </div>
        </div>

        {/* Admin Login Dialog for Paul Wang */}
        {showAdminLogin && (
          <div className="mb-5 p-4 bg-[#eff5ef] rounded-2xl border border-[#b8d4bd] animate-in fade-in">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#2d4237] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#547a6b]" />
                <span>管理者身分驗證登入</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowAdminLogin(false);
                  setLoginError('');
                }}
                className="text-xs text-[#71877c] hover:underline cursor-pointer"
              >
                關閉
              </button>
            </div>
            <form onSubmit={handleAdminVerify} className="space-y-2.5">
              <p className="text-[11px] text-[#557062]">
                請輸入管理者安全密碼以解鎖庫存管理後台與編輯權限：
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={adminEmailInput}
                  onChange={(e) => setAdminEmailInput(e.target.value)}
                  placeholder="請輸入密碼"
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#cad8cb] rounded-xl focus:outline-hidden"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-semibold cursor-pointer shadow-2xs"
                >
                  確認身分
                </button>
              </div>
              {loginError && (
                <p className="text-[11px] text-[#c0392b] font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {loginError}
                </p>
              )}
            </form>
          </div>
        )}

        {/* SECTION A: When Current User is Administrator -> Show Applications Review List */}
        {currentRole === 'admin' ? (
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#2d4237] flex items-center gap-2">
                <span>人員權限申請審核清單</span>
                {pendingApps.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full bg-[#ff4d2e] text-white text-[10px] font-bold">
                    {pendingApps.length} 待批准
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-[#edf3ed] text-[#526e60] text-[10px] font-semibold border border-[#d3ded2]">
                    0 待批准
                  </span>
                )}
              </h4>
              <span className="text-xs text-[#71877c]">需管理者本人批准方可生效</span>
            </div>

            {/* Empty State when no pending applications */}
            {pendingApps.length === 0 ? (
              <div className="p-6 bg-[#f7f9f6] rounded-2xl border border-dashed border-[#d8e2d7] text-center text-xs text-[#6e8579] space-y-1">
                <p className="font-semibold text-[#3a5447]">目前無待批准的人員權限申請項目</p>
                <p className="text-[11px] text-[#7d9387]">
                  所有經由分享連結訪問之人員皆嚴格預設為唯讀檢視者，無任何編輯權限。
                </p>
              </div>
            ) : (
              /* Pending Applications List */
              <div className="space-y-3">
                {pendingApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 bg-white rounded-2xl border border-[#d9e4d8] shadow-2xs hover:border-[#b9ccb8] transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-[#e3ede3] text-[#4d7263] flex items-center justify-center font-bold text-xs">
                          {app.applicantName[0]}
                        </div>
                        <div>
                          <span className="font-bold text-sm text-[#2d4237]">{app.applicantName}</span>
                          <span className="text-xs text-[#71877c] ml-2">({app.department})</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-mono text-[#8a9f93]">{app.timestamp}</span>
                    </div>

                    <div className="text-xs text-[#667e72] font-mono mb-2">
                      申請 Email: <strong className="text-[#3b5548]">{app.email}</strong>
                    </div>

                    <div className="bg-[#f7f9f6] p-2.5 rounded-xl text-xs text-[#495f54] mb-3 border border-[#edf3ec]">
                      <strong className="text-[#364d42]">申請理由：</strong>
                      {app.reason}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#71877c]">
                        申請權限：<strong className="text-[#547a6b]">管理者 (Admin)</strong>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onRejectApplication(app.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#d6e0d5] text-[#697f74] hover:bg-[#fae8e8] hover:text-[#c53030] hover:border-[#e2b0b0] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>駁回</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onApproveApplication(app.id)}
                          className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>批准通過</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* History Records */}
            {historyApps.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-bold text-[#62776c] block mb-2">近期審核紀錄</span>
                <div className="space-y-2">
                  {historyApps.map((h) => (
                    <div
                      key={h.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#f8faf7] border border-[#e4ede3] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#2d4237]">{h.applicantName}</span>
                        <span className="text-[#71877c]">({h.department})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            h.status === 'approved'
                              ? 'bg-[#e8f5e9] text-[#2e7d32] border border-[#c8e6c9]'
                              : 'bg-[#ffebee] text-[#c62828] border border-[#ffcdd2]'
                          }`}
                        >
                          {h.status === 'approved' ? '已批准' : '已駁回'}
                        </span>
                        <span className="text-[10px] text-[#8a9f93] font-mono">{h.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* SECTION B: When Current User is Visitor -> Application Form for Admin Approval */
          <div className="space-y-4">
            <div className="p-4 bg-[#f8faf7] rounded-2xl border border-[#dbe6da]">
              <div className="flex items-center gap-2.5 mb-2">
                <Lock className="w-4 h-4 text-[#547a6b]" />
                <h4 className="text-sm font-bold text-[#2d4237]">您目前為一般檢視者權限</h4>
              </div>
              <p className="text-xs text-[#526a5e] leading-relaxed mb-3">
                本平台嚴格實行權限審核機制。所有新增品項、編輯在席庫存數量、更動儲位與產品照片上傳，均需最高系統管理者 <strong>Paul Wang ({SUPER_ADMIN_EMAIL})</strong> 本人審批開通。
              </p>

              {!showApplyForm ? (
                <button
                  type="button"
                  onClick={() => setShowApplyForm(true)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>向管理者提交權限申請</span>
                </button>
              ) : (
                <form onSubmit={handleApply} className="space-y-3 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[#455c50] mb-1">
                        申請人姓名
                      </label>
                      <input
                        type="text"
                        value={applyName}
                        onChange={(e) => setApplyName(e.target.value)}
                        placeholder="請輸入姓名"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#d6e0d5] rounded-xl focus:outline-hidden"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#455c50] mb-1">
                        電子郵件 (開通用)
                      </label>
                      <input
                        type="email"
                        value={applyEmail}
                        onChange={(e) => setApplyEmail(e.target.value)}
                        placeholder="yourname@company.com"
                        className="w-full px-3 py-2 text-xs bg-white border border-[#d6e0d5] rounded-xl focus:outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#455c50] mb-1">
                      所屬部門 / 課別
                    </label>
                    <input
                      type="text"
                      value={applyDept}
                      onChange={(e) => setApplyDept(e.target.value)}
                      placeholder="例如: 行銷企劃課 / 通路發展部"
                      className="w-full px-3 py-2 text-xs bg-white border border-[#d6e0d5] rounded-xl focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#455c50] mb-1">
                      申請權限說明與業務需求理由
                    </label>
                    <textarea
                      value={applyReason}
                      onChange={(e) => setApplyReason(e.target.value)}
                      placeholder="請說明需要管理者編輯權限之原因（例：負責新樣品建檔與盤點維護）"
                      rows={2}
                      className="w-full px-3 py-2 text-xs bg-white border border-[#d6e0d5] rounded-xl focus:outline-hidden resize-none"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowApplyForm(false)}
                      className="px-3.5 py-1.5 rounded-xl border border-[#d6e0d5] text-[#556e62] hover:bg-[#edf2ec] text-xs font-medium cursor-pointer"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-semibold shadow-2xs cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>送出審核申請</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#93b7b2] hover:bg-[#82a8a3] text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
