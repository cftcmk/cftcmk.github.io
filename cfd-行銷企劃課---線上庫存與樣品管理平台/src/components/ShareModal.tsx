import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  QrCode,
  Smartphone,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  onToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Generate shareable URL (converts internal ais-dev- to public ais-pre- URL for external/incognito access)
  const getShareableUrl = () => {
    if (typeof window === 'undefined') {
      return 'https://ais-pre-gpus7ijhoswju5sidqs2vn-89601270471.asia-northeast1.run.app';
    }
    let origin = window.location.origin || '';
    if (!origin || origin === 'null') {
      origin = window.location.href.split('?')[0].split('#')[0];
    }
    if (origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    return origin.replace(/\/+$/, '') || 'https://ais-pre-gpus7ijhoswju5sidqs2vn-89601270471.asia-northeast1.run.app';
  };

  const currentUrl = getShareableUrl();

  // Generate a clean QR code URL via reliable public QR code generator API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=10&data=${encodeURIComponent(
    currentUrl
  )}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = currentUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      onToast('已成功複製網站連結！可直接傳送給同仁');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      onToast('複製失敗，請手動複製網址');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'CFD 行銷企劃課 - 線上庫存與樣品管理平台',
          text: 'CFD 行銷企劃課樣品庫存管理平台，提供即時樣品在庫查詢與借調申請。',
          url: currentUrl,
        });
        onToast('已開啟系統分享選單');
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#e1e9df] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-[#edf2ec] bg-[#f7faf6]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#e8f1e9] flex items-center justify-center text-[#426b55]">
              <Share2 className="w-5 h-5 text-[#547a6b]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#2d4037]">分享此網站</h3>
              <p className="text-xs text-[#6e8578]">CFD 行銷企劃課 樣品庫存管理平台</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#7d9487] hover:text-[#2d4037] hover:bg-[#eaf1e9] transition-colors cursor-pointer"
            title="關閉"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center gap-5">
          {/* QR Code Container */}
          <div className="flex flex-col items-center bg-[#f7faf6] p-4.5 rounded-2xl border border-[#e3ebe1] shadow-2xs w-full max-w-[240px]">
            <div className="w-40 h-40 bg-white rounded-xl p-2 border border-[#d6e3d5] shadow-inner flex items-center justify-center overflow-hidden">
              <img
                src={qrCodeUrl}
                alt="網站分享 QR Code"
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="flex items-center gap-1.5 mt-3 text-xs text-[#526f61] font-medium">
              <QrCode className="w-3.5 h-3.5" />
              <span>使用手機相機掃描即可開啟</span>
            </div>
          </div>

          {/* URL Box & Copy Button */}
          <div className="w-full flex flex-col gap-2">
            <label className="text-xs font-semibold text-[#486355]">網站連結網址</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#f5f8f4] border border-[#d6e2d4] text-xs font-mono text-[#334b3f] select-all focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0 ${
                  copied
                    ? 'bg-[#3b7a57] text-white'
                    : 'bg-[#547a6b] hover:bg-[#46675a] text-white'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已複製' : '複製連結'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex items-center gap-2.5 pt-1">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#e9f2eb] hover:bg-[#dce9df] text-[#335645] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#cde0d1]"
              >
                <Smartphone className="w-4 h-4" />
                <span>手機系統分享</span>
              </button>
            )}
            <a
              href={currentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-[#f3f7f2] text-[#4d6658] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#d0dfd2]"
            >
              <ExternalLink className="w-4 h-4" />
              <span>在新視窗開啟</span>
            </a>
          </div>

          {/* Quick Notice */}
          <div className="w-full p-3 bg-[#f0f5ee] rounded-xl border border-[#dbe6d9] text-[11px] text-[#557162] leading-relaxed flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#547a6b] shrink-0 mt-0.5" />
            <span>
              可直接將此連結傳送給企劃課夥伴、業務同仁或外部樣品借用單位，隨時在手機或電腦上瀏覽即時規格與在庫庫存。
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
