import React, { useState } from 'react';
import { MemoryItem } from '../types';

interface PinAuthModalProps {
  item: MemoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: MemoryItem) => void;
}

export const PinAuthModal: React.FC<PinAuthModalProps> = ({
  item,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);

  if (!isOpen || !item) return null;

  const handleKeyClick = (digit: string) => {
    setHasError(false);
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);

      if (nextPin.length === 4) {
        const expectedPin = item.pin || '1234';
        if (nextPin === expectedPin) {
          setTimeout(() => {
            setPin('');
            onSuccess(item);
          }, 180);
        } else {
          setHasError(true);
          setTimeout(() => {
            setPin('');
          }, 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setHasError(false);
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handleReset = () => {
    setPin('');
    setHasError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col gap-4 pb-safe animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between pb-2 border-b border-[#efeeea]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#6b5c44] text-[22px]">lock</span>
            <h3 className="font-bold text-base text-[#1b1c1a]">보안 인증</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#efeeea] flex items-center justify-center text-[#887362] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="text-center flex flex-col items-center gap-0.5">
          <p className="text-xs text-[#887362]">{item.category || '보안/비번'}</p>
          <p className="font-bold text-base text-[#1b1c1a]">{item.lockHint || '보안 메모'}</p>
          <p className="text-xs text-[#554335]/80 mt-1">4자리 PIN 번호를 입력하세요</p>
        </div>

        {/* 4-Pin Dots Indicator */}
        <div className="flex items-center justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  hasError
                    ? 'bg-[#ba1a1a] scale-110'
                    : isFilled
                    ? 'bg-[#6b5c44] shadow-md scale-110'
                    : 'border-2 border-[#6b5c44]/40 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {/* Error message slot */}
        <div className="h-5 flex items-center justify-center -mt-1">
          {hasError && (
            <p className="text-xs text-[#ba1a1a] font-bold animate-pulse">
              PIN 번호가 일치하지 않습니다.
            </p>
          )}
        </div>

        {/* Numeric Keypad (4x3) */}
        <div className="grid grid-cols-3 gap-2 px-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyClick(digit)}
              className="h-12 rounded-xl bg-[#f5f4f0] hover:bg-[#efeeea] text-[#1b1c1a] font-bold text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleReset}
            className="h-12 rounded-xl bg-[#efeeea] hover:bg-[#e9e8e4] text-[#887362] hover:text-[#1b1c1a] text-xs font-semibold flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          >
            재입력
          </button>
          <button
            type="button"
            onClick={() => handleKeyClick('0')}
            className="h-12 rounded-xl bg-[#f5f4f0] hover:bg-[#efeeea] text-[#1b1c1a] font-bold text-lg flex items-center justify-center active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-xl bg-[#efeeea] hover:bg-[#e9e8e4] text-[#1b1c1a] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">backspace</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-xs text-[#887362] hover:text-[#1b1c1a] font-medium transition-colors text-center cursor-pointer"
        >
          인증 취소 및 닫기
        </button>
      </div>
    </div>
  );
};
