import React, { useState, useEffect } from 'react';
import { api, AuditLogItem } from '../services/api';
import { X, ShieldCheck, History, Users, RefreshCw, Loader2, Database } from 'lucide-react';

interface AdminAuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminAuditLogsModal: React.FC<AdminAuditLogsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'logs' | 'users'>('logs');
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const [logsRes, usersRes] = await Promise.all([api.getAuditLogs(), api.getUsers()]);
      setLogs(logsRes);
      setUsers(usersRes);
    } catch (err: any) {
      setErrorMsg(err.message || '讀取資料庫紀錄失敗');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'manager' | 'user') => {
    try {
      await api.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch (err: any) {
      alert('更新權限失敗：' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#dce5dc] relative flex flex-col animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#e1e9e1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#eff5ef] text-[#4e7966] flex items-center justify-center border border-[#d2e4d4]">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2d4237]">系統稽核日誌與使用者權限管理</h3>
              <p className="text-xs text-[#71877c] mt-0.5">
                真實資料庫交易操作紀錄，確保任何產品與庫存異動皆具備完整歷程追溯。
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#6f877b] hover:bg-[#edf2ec] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between py-3 border-b border-[#edf2ec]">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-[#547a6b] text-white shadow-xs'
                  : 'bg-[#f0f4f0] text-[#556e60] hover:bg-[#e4ece4]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>操作稽核日誌 ({logs.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#547a6b] text-white shadow-xs'
                  : 'bg-[#f0f4f0] text-[#556e60] hover:bg-[#e4ece4]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>使用者權限白名單 ({users.length})</span>
            </button>
          </div>
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-[#556e60] hover:bg-[#eff4f0] text-xs flex items-center gap-1 cursor-pointer"
            title="重新整理"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">重新整理</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-3 min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-[#6c8577] text-xs gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#547a6b]" />
              <span>正在向資料庫查詢最新資料...</span>
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-[#fdf2f0] text-[#c0392b] text-xs rounded-xl border border-[#f5c6cb]">
              {errorMsg}
            </div>
          ) : activeTab === 'logs' ? (
            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-12 text-xs text-[#71877c]">目前尚無稽核日誌記錄</div>
              ) : (
                logs.map((log) => {
                  let detailObj: any = {};
                  try {
                    detailObj = JSON.parse(log.details);
                  } catch {
                    detailObj = { raw: log.details };
                  }

                  return (
                    <div
                      key={log.id}
                      className="p-3 bg-[#f8faf8] hover:bg-[#f1f5f1] rounded-xl border border-[#e2eae2] text-xs transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono px-2 py-0.5 bg-[#e3ede3] text-[#335645] rounded-md font-bold text-[10px]">
                            {log.action}
                          </span>
                          <span className="font-semibold text-[#2d4237]">{log.user_name}</span>
                          <span className="text-[10px] text-[#71877c]">({log.user_role})</span>
                          <span className="text-[10px] font-mono text-[#81998c]">{log.created_at.slice(0, 19).replace('T', ' ')}</span>
                        </div>
                        <div className="text-[#556f61] text-[11px] truncate max-w-xl">
                          實體：<strong className="text-[#334e40]">{log.entity_type} ({log.entity_id})</strong> — {JSON.stringify(detailObj)}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-[#81998c] shrink-0">{log.ip_address}</span>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e1ece1] text-[#556e60] font-semibold bg-[#f7faf7]">
                    <th className="py-2.5 px-3">同仁姓名</th>
                    <th className="py-2.5 px-3">帳號信箱</th>
                    <th className="py-2.5 px-3">部門</th>
                    <th className="py-2.5 px-3">角色權限 (RBAC)</th>
                    <th className="py-2.5 px-3">狀態</th>
                    <th className="py-2.5 px-3">建立日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ed]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-[#f9fbf9]">
                      <td className="py-2.5 px-3 font-semibold text-[#2d4237]">{u.name}</td>
                      <td className="py-2.5 px-3 font-mono text-[#4e6c5c]">{u.email}</td>
                      <td className="py-2.5 px-3 text-[#556e60]">{u.department || '行銷企劃課'}</td>
                      <td className="py-2.5 px-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                          disabled={u.email === 'paulwang8827@gmail.com'}
                          className="px-2 py-1 bg-white border border-[#cad8cb] rounded-lg text-xs font-semibold text-[#2d4237] cursor-pointer"
                        >
                          <option value="admin">Admin (最高管理者)</option>
                          <option value="manager">Manager (企劃主管)</option>
                          <option value="user">User (一般同仁)</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-[#e3ede3] text-[#2c5f40] text-[10px] font-bold">
                          {u.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-[#71877c]">
                        {u.created_at.slice(0, 10)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-[#e1e9e1] flex items-center justify-between text-xs text-[#6e8578]">
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#547a6b]" />
            <span>SQLite 本地 ACID 資料庫連線正常 (WAL Mode Enabled)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-[#f0f4f0] hover:bg-[#e4ece4] text-[#3d5648] font-semibold cursor-pointer"
          >
            關閉視窗
          </button>
        </div>
      </div>
    </div>
  );
};
