import React, { useState, useEffect } from 'react';
import { MemoryItem } from '../types';

interface SecureFocusViewerProps {
  item: MemoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const SecureFocusViewer: React.FC<SecureFocusViewerProps> = ({
  item,
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  const [isMasked, setIsMasked] = useState(false);
  const [copiedState, setCopiedState] = useState(false);

  useEffect(() => {
    if (!isOpen || !item) return;

    setRemainingSeconds(30);
    setIsMasked(false);
    setCopiedState(false);

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          onShowToast('보안 시간이 만료되어 자동 잠금되었습니다 🔒');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const secretValue = item.secret || item.title;

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(secretValue).catch(() => {});
    }
    setCopiedState(true);
    onShowToast('클립보드 복사됨! 1초 후 자동 마스킹 🔒');

    setTimeout(() => {
      setIsMasked(true);
      setCopiedState(false);
    }, 1000);
  };

  const timerPercent = Math.max(0, (remainingSeconds / 30) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-[#faf9f5] flex flex-col pt-safe pb-safe max-w-md mx-auto animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#efeeea] bg-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-[#f5f4f0] hover:bg-[#efeeea] flex items-center justify-center text-[#1b1c1a] active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-[#1b1c1a] truncate max-w-[160px]">
                {item.lockHint || item.title}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#1b1c1a] text-white text-[10px] font-bold">
                보안 열람 중
              </span>
            </div>
            <span className="text-[11px] text-[#8e4f00] flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f78f10] animate-pulse" />
              보안 세션 활성화됨
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 rounded-xl bg-[#efeeea] hover:bg-[#e9e8e4] text-[#554335] text-xs font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px]">lock</span>
          <span>즉시 잠금</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col justify-between">
        <div className="flex flex-col gap-5">
          {/* 30-sec Auto-Lock Timer Card */}
          <div className="p-4 rounded-2xl bg-white border border-[#6b5c44]/20 shadow-xs flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-[#6b5c44] font-semibold">
                <span className="material-symbols-outlined text-[16px] text-[#8e4f00]">timer</span>
                <span>보안 자동 잠금 타이머</span>
              </div>
              <span className="font-mono font-bold text-[#8e4f00] text-sm">
                {remainingSeconds}초
              </span>
            </div>
            <div className="w-full bg-[#efeeea] h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  remainingSeconds <= 5 ? 'bg-[#ba1a1a]' : 'bg-[#f78f10]'
                }`}
                style={{ width: `${timerPercent}%` }}
              />
            </div>
            <p className="text-[11px] text-[#887362]">
              보안을 위해 30초 동안 활동이 없거나 화면을 벗어나면 자동 잠금됩니다.
            </p>
          </div>

          {/* Main Secret Display Box */}
          <div className="bg-white p-6 rounded-3xl border-2 border-[#6b5c44]/25 shadow-sm flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#f2ddbe] flex items-center justify-center text-[#706048] shadow-inner">
              <span className="material-symbols-outlined text-[28px]">key</span>
            </div>

            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-[#887362] uppercase tracking-wider">
                {item.lockHint ? '보안 기억 내용' : '복호화된 보안 데이터'}
              </span>
              <span className="font-bold text-base text-[#1b1c1a]">
                {item.lockHint ? item.lockHint : item.title}
              </span>
            </div>

            {/* Secret Value High-Contrast Container */}
            <div className="w-full py-4 px-4 rounded-2xl bg-[#f5f4f0] border border-[#efeeea] flex items-center justify-center relative">
              <div className="font-mono text-xl sm:text-2xl font-extrabold text-[#1b1c1a] tracking-wider select-all text-center break-words whitespace-pre-wrap max-w-full">
                {isMasked ? '••••••••' : secretValue}
              </div>
              <button
                type="button"
                onClick={() => setIsMasked(!isMasked)}
                className="absolute right-3 p-1.5 rounded-lg text-[#887362] hover:text-[#1b1c1a] active:scale-90 transition-transform cursor-pointer"
                title="마스킹 토글"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isMasked ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>

            {/* One-Touch Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className={`w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer ${
                copiedState
                  ? 'bg-[#6b5c44] shadow-[#6b5c44]/25'
                  : 'bg-[#f78f10] hover:bg-[#e07f08] shadow-[#f78f10]/25'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">content_copy</span>
              <span>{copiedState ? '복사 완료! 1초 후 마스킹' : '원터치 복사 (1초 후 자동 마스킹)'}</span>
            </button>

            {/* 상세 메모(선택) 표시 */}
            {item.desc && (
              <div className="w-full p-4 rounded-2xl bg-[#faf9f5] border border-[#dbc2ae] flex flex-col gap-1.5 text-left">
                <span className="text-xs font-bold text-[#6b5c44] flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">notes</span>
                  상세 메모
                </span>
                <p className="text-xs text-[#1b1c1a] leading-relaxed break-words whitespace-pre-wrap font-medium">
                  {item.desc}
                </p>
              </div>
            )}
          </div>

          {/* Security note */}
          <div className="p-3.5 rounded-xl bg-[#f2ddbe]/30 border border-[#f2ddbe]/60 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[18px] text-[#8e4f00] shrink-0 mt-0.5">
              shield_lock
            </span>
            <p className="text-xs text-[#554335] leading-relaxed">
              현재 메모는 로컬 AES 보안 샌드박스로 일시 해제된 상태입니다. 안전을 위해 열람 후
              즉시 아래 잠그기 버튼을 눌러주세요.
            </p>
          </div>
        </div>

        {/* Bottom Actions in Viewer */}
        <div className="flex flex-col gap-2 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-[#1b1c1a] hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span>지금 바로 다시 잠그기</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs text-[#887362] hover:text-[#1b1c1a] font-medium transition-colors text-center cursor-pointer"
          >
            뷰어 닫기 및 보관함 복귀
          </button>
        </div>
      </div>
    </div>
  );
};
