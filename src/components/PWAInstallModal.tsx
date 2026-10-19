import React, { useState } from 'react';
import {
  X,
  Smartphone,
  Download,
  Copy,
  Check,
  Share2,
  PlusSquare,
  Sparkles,
  QrCode,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  appUrl,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [activePlatform, setActivePlatform] = useState<'ios' | 'android'>(
    isIOS ? 'ios' : 'android'
  );

  const downloadUrl =
    appUrl ||
    (typeof window !== 'undefined'
      ? window.location.href.split('#')[0]
      : 'https://ais-pre-gpus7ijhoswju5sidqs2vn-89601270471.asia-northeast1.run.app');

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-7 shadow-2xl border border-[#dce5dc] relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 rounded-full text-[#6f877b] hover:bg-[#edf2ec] transition-colors cursor-pointer"
          title="關閉"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-[#edf2ec]">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8bb5b0] to-[#5a8b84] text-white flex items-center justify-center shadow-xs">
            <Smartphone className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#2d4237] flex items-center gap-2">
              <span>下載至手機作為 App 使用</span>
              <span className="px-2 py-0.5 rounded-full bg-[#e8f1eb] text-[#3d6554] text-[10px] font-semibold">
                PWA 免安裝商店
              </span>
            </h3>
            <p className="text-xs text-[#71877c] mt-0.5">
              一鍵將 CFD 庫存管理平台釘選至手機主畫面，享有如原生 App 般的極速體驗。
            </p>
          </div>
        </div>

        {/* Quick One-Click Install Button if Browser Supports Direct Prompt */}
        {isInstallable && (
          <div className="mb-5 p-4 rounded-2xl bg-[#eef5ee] border border-[#bcd3c4] flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-[#2c4038]">
                偵測到您的裝置支援一鍵安裝
              </h4>
              <p className="text-[11px] text-[#557063] mt-0.5">
                點擊下方按鈕，系統將自動將 App 下載安裝至桌面。
              </p>
            </div>
            <button
              onClick={handleInstallClick}
              className="px-4 py-2 rounded-xl bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-bold shadow-xs cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>立即安裝 App</span>
            </button>
          </div>
        )}

        {/* Fast Download Link & Share Container */}
        <div className="mb-5 p-4 rounded-2xl bg-[#f7faf6] border border-[#e2ebe0]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#425d50] flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-[#547a6b]" />
              <span>手機快速下載連結</span>
            </span>
            <span className="text-[10px] text-[#71877c]">可直接轉傳至 LINE / 信箱</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={downloadUrl}
              className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-[#d2ded2] rounded-xl text-[#334a41] select-all focus:outline-hidden truncate"
            />
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs shrink-0 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#547a6b] hover:bg-[#436457] text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>已複製</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>複製連結</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Platform Tabs: iOS (iPhone) vs Android */}
        <div className="mb-4">
          <div className="flex items-center bg-[#f0f4ef] p-1 rounded-2xl text-xs mb-3">
            <button
              onClick={() => setActivePlatform('ios')}
              className={`flex-1 py-1.5 rounded-xl font-semibold transition-all cursor-pointer text-center ${
                activePlatform === 'ios'
                  ? 'bg-white text-[#2c4038] shadow-xs'
                  : 'text-[#64796e]'
              }`}
            >
              Apple iOS (iPhone / iPad)
            </button>
            <button
              onClick={() => setActivePlatform('android')}
              className={`flex-1 py-1.5 rounded-xl font-semibold transition-all cursor-pointer text-center ${
                activePlatform === 'android'
                  ? 'bg-white text-[#2c4038] shadow-xs'
                  : 'text-[#64796e]'
              }`}
            >
              Android (Chrome / Edge / 三星)
            </button>
          </div>

          {/* Guide Steps */}
          {activePlatform === 'ios' ? (
            <div className="space-y-2.5 text-xs text-[#395045] bg-[#fafcfa] p-4 rounded-2xl border border-[#e4ede3]">
              <h4 className="font-bold text-[#2d4237] flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#547a6b]" />
                <span>iPhone / iPad 安裝三步驟（使用 Safari 瀏覽器）</span>
              </h4>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#e3ece2] text-[#426154] font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <p className="leading-relaxed">
                  在 iPhone 上使用 <strong>Safari</strong> 開啟上述下載連結。
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#e3ece2] text-[#426154] font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <p className="leading-relaxed flex items-center gap-1 flex-wrap">
                  點擊螢幕下方 Safari 工具列的
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#edf2ec] rounded text-[11px] font-semibold border border-[#d6e0d5]">
                    <Share2 className="w-3 h-3 text-[#547a6b]" /> 分享
                  </span>
                  按鈕。
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#e3ece2] text-[#426154] font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <p className="leading-relaxed flex items-center gap-1 flex-wrap">
                  向下滑動選單並點選
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#edf2ec] rounded text-[11px] font-semibold border border-[#d6e0d5]">
                    <PlusSquare className="w-3 h-3 text-[#547a6b]" /> 加入主畫面
                  </span>
                  ，點擊右上角「新增」即完成安裝！
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 text-xs text-[#395045] bg-[#fafcfa] p-4 rounded-2xl border border-[#e4ede3]">
              <h4 className="font-bold text-[#2d4237] flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-[#547a6b]" />
                <span>Android 手機安裝指引（使用 Chrome 瀏覽器）</span>
              </h4>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#e3ece2] text-[#426154] font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </span>
                <p className="leading-relaxed">
                  在手機上使用 <strong>Google Chrome</strong> 開啟上述下載連結。
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#e3ece2] text-[#426154] font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </span>
                <p className="leading-relaxed">
                  點擊瀏覽器右上角的選單按鈕（三個直點 <strong>⋮</strong>）。
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#e3ece2] text-[#426154] font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </span>
                <p className="leading-relaxed">
                  點選 <strong>「安裝應用程式」</strong> 或 <strong>「新增至主螢幕」</strong>，確認後桌面即生成 App 圖示！
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Benefits Footnote */}
        <div className="grid grid-cols-3 gap-2 py-3 border-t border-[#edf2ec] text-center text-[11px] text-[#5b7367]">
          <div className="p-2 rounded-xl bg-[#f5f8f4]">
            <span className="block font-bold text-[#2c4038]">⚡ 0秒秒開</span>
            <span className="text-[10px] text-[#71877c]">免佔用空間</span>
          </div>
          <div className="p-2 rounded-xl bg-[#f5f8f4]">
            <span className="block font-bold text-[#2c4038]">📱 全螢幕沉浸</span>
            <span className="text-[10px] text-[#71877c]">無瀏覽器網址列</span>
          </div>
          <div className="p-2 rounded-xl bg-[#f5f8f4]">
            <span className="block font-bold text-[#2c4038]">🔄 自動同步</span>
            <span className="text-[10px] text-[#71877c]">即時在庫盤點</span>
          </div>
        </div>

        {/* Footer Close */}
        <div className="mt-4 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full bg-[#547a6b] hover:bg-[#436457] text-white text-xs font-medium cursor-pointer transition-colors shadow-2xs"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};
