import React from 'react';
import { MainCategory, StockTransaction } from '../types/inventory';
import {
  FileSpreadsheet,
  AlertTriangle,
  History,
  TrendingDown,
  Warehouse,
  CheckCircle,
} from 'lucide-react';

interface AuditReportViewProps {
  categories: MainCategory[];
  transactions: StockTransaction[];
  onQuickAuditFix: (modelCode: string, variantCode: string, targetCount: number) => void;
}

export const AuditReportView: React.FC<AuditReportViewProps> = ({
  categories,
  transactions,
  onQuickAuditFix,
}) => {
  // Compute metrics
  let totalSKUs = 0;
  let totalItemsCount = 0;
  let totalValuation = 0;
  const lowStockItems: {
    categoryName: string;
    modelCode: string;
    modelName: string;
    variantCode: string;
    variantName: string;
    totalStock: number;
    safetyStock: number;
    locationBin: string;
  }[] = [];

  categories.forEach((cat) => {
    cat.models.forEach((m) => {
      m.variants.forEach((v) => {
        totalSKUs++;
        totalItemsCount += v.totalStock;
        totalValuation += v.totalStock * v.unitPrice;
        if (v.totalStock <= v.safetyStock) {
          lowStockItems.push({
            categoryName: cat.name,
            modelCode: m.code,
            modelName: m.name,
            variantCode: v.code,
            variantName: v.name,
            totalStock: v.totalStock,
            safetyStock: v.safetyStock,
            locationBin: v.locationBin,
          });
        }
      });
    });
  });

  return (
    <div className="w-full space-y-6">
      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#e2e9e1] shadow-2xs">
          <p className="text-xs font-semibold text-[#667d71]">全平台管理規格 (SKU)</p>
          <p className="text-2xl font-bold text-[#2d4237] mt-1 tabular-nums">{totalSKUs} <span className="text-xs font-normal text-[#7f9488]">款規格</span></p>
          <p className="text-[11px] text-[#7d9388] mt-1">涵蓋 6 大窗簾產品系列</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e2e9e1] shadow-2xs">
          <p className="text-xs font-semibold text-[#667d71]">在席總庫存數量</p>
          <p className="text-2xl font-bold text-[#2d4237] mt-1 tabular-nums">{totalItemsCount.toLocaleString()} <span className="text-xs font-normal text-[#7f9488]">件</span></p>
          <p className="text-[11px] text-[#7d9388] mt-1">4 大實體分倉即時匯總</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e2e9e1] shadow-2xs">
          <p className="text-xs font-semibold text-[#667d71]">在庫存貨總估值</p>
          <p className="text-2xl font-bold text-[#2d4237] mt-1 tabular-nums">NT$ {(totalValuation / 10000).toFixed(1)}萬</p>
          <p className="text-[11px] text-[#7d9388] mt-1">平均毛利儲備健康度 94.2%</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e2e9e1] shadow-2xs">
          <p className="text-xs font-semibold text-[#c04b1e] flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> 低於安全水位預警
          </p>
          <p className="text-2xl font-bold text-[#c04b1e] mt-1 tabular-nums">{lowStockItems.length} <span className="text-xs font-normal text-[#9b583f]">項品號</span></p>
          <p className="text-[11px] text-[#9b583f] mt-1">建議採購補貨或提前生產</p>
        </div>
      </div>

      {/* Low Stock Warning Alert Table */}
      <div className="bg-white rounded-3xl p-6 border border-[#e2e9e1] shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#eef3ee] mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#c04b1e]" />
            <h3 className="text-base font-bold text-[#2d4237]">
              低庫存警戒品項清單
            </h3>
          </div>
          <span className="text-xs text-[#71877c]">
            觸發閥值: 在庫量 ≤ 安全儲備水位
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e2e9e1] text-[#63796d]">
                <th className="py-2.5 px-3 font-semibold">系列</th>
                <th className="py-2.5 px-3 font-semibold">型號代碼</th>
                <th className="py-2.5 px-3 font-semibold">規格名稱</th>
                <th className="py-2.5 px-3 font-semibold">色票 (SKU)</th>
                <th className="py-2.5 px-3 font-semibold">倉位</th>
                <th className="py-2.5 px-3 font-semibold tabular-nums text-right">當前在庫</th>
                <th className="py-2.5 px-3 font-semibold tabular-nums text-right">安全水位</th>
                <th className="py-2.5 px-3 font-semibold text-center">快捷盤點修正</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2ed]">
              {lowStockItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-[#f6f9f5] transition-colors">
                  <td className="py-3 px-3 font-medium text-[#465d51]">{item.categoryName}</td>
                  <td className="py-3 px-3 font-extrabold text-[#477a6f]">{item.modelCode}</td>
                  <td className="py-3 px-3 text-[#2d4237] max-w-xs truncate">{item.modelName}</td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-[#de5e2b] mr-1">{item.variantCode}</span>
                    <span className="text-[#5c7367]">{item.variantName}</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-[#5c7367]">{item.locationBin}</td>
                  <td className="py-3 px-3 text-right font-bold text-[#c04b1e] tabular-nums">
                    {item.totalStock} 件
                  </td>
                  <td className="py-3 px-3 text-right text-[#7d9388] tabular-nums">
                    {item.safetyStock} 件
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => onQuickAuditFix(item.modelCode, item.variantCode, item.safetyStock + 10)}
                      className="px-3 py-1 bg-[#e7efe9] hover:bg-[#d4e4d7] text-[#345143] text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
                    >
                      補足安全水位
                    </button>
                  </td>
                </tr>
              ))}
              {lowStockItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#7f9589]">
                    目前所有品項庫存充足，未達告警標準！
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Transaction Log History */}
      <div className="bg-white rounded-3xl p-6 border border-[#e2e9e1] shadow-2xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#eef3ee] mb-4">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-[#5e8473]" />
            <h3 className="text-base font-bold text-[#2d4237]">
              近期倉儲異動與審核日誌 (Audit Log)
            </h3>
          </div>
          <span className="text-xs text-[#71877c]">
            系統自動留存不可竄改紀錄
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e2e9e1] text-[#63796d]">
                <th className="py-2.5 px-3 font-semibold">紀錄編號</th>
                <th className="py-2.5 px-3 font-semibold">異動類型</th>
                <th className="py-2.5 px-3 font-semibold">產品規格</th>
                <th className="py-2.5 px-3 font-semibold tabular-nums text-right">數量</th>
                <th className="py-2.5 px-3 font-semibold">庫位</th>
                <th className="py-2.5 px-3 font-semibold">事由說明</th>
                <th className="py-2.5 px-3 font-semibold">經辦人員</th>
                <th className="py-2.5 px-3 font-semibold">時間戳記</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf2ed]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#f6f9f5] transition-colors">
                  <td className="py-3 px-3 font-mono text-[#5c7367]">{tx.id}</td>
                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        tx.type === 'IN'
                          ? 'bg-[#e2f1e6] text-[#2e6e40]'
                          : tx.type === 'OUT'
                          ? 'bg-[#fbece4] text-[#b64b22]'
                          : 'bg-[#e7eef7] text-[#2c537d]'
                      }`}
                    >
                      {tx.type === 'IN'
                        ? '入庫'
                        : tx.type === 'OUT'
                        ? '出庫'
                        : '盤點校正'}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-medium text-[#2d4237]">
                    <span className="text-[#477a6f] font-bold mr-1">{tx.modelCode}</span>
                    <span className="text-[#de5e2b] font-bold mr-1.5">{tx.skuCode}</span>
                    <span className="text-slate-600">{tx.variantName}</span>
                  </td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums">
                    <span className={tx.quantity > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity} 件
                    </span>
                  </td>
                  <td className="py-3 px-3 text-[#5c7367]">{tx.warehouse}</td>
                  <td className="py-3 px-3 text-[#3f564a]">{tx.reason}</td>
                  <td className="py-3 px-3 text-[#5c7367]">{tx.operator}</td>
                  <td className="py-3 px-3 font-mono text-[#7d9388]">{tx.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
