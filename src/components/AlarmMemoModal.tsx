import React from 'react';
import { MemoryItem } from '../types';
import { exportToPhoneCalendar } from '../utils/calendar';

interface AlarmMemoModalProps {
  item: MemoryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (item: MemoryItem) => void;
  onSnooze: (item: MemoryItem, minutes: number) => void;
  onEdit?: (item: MemoryItem) => void;
}

export const AlarmMemoModal: React.FC<AlarmMemoModalProps> = ({
  item,
  isOpen,
  onClose,
  onComplete,
  onSnooze,
  onEdit,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Blurred Backdrop with pulsing alarm glow */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Main Alert Card */}
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden z-10 border-2 border-[#f78f10] animate-in zoom-in-95 duration-250 flex flex-col">
        {/* Top Alarm Header Banner */}
        <div className="bg-gradient-to-r from-[#f78f10] to-[#e07f08] p-4 text-white flex items-center justify-between relative overflow-hidden">
          <div className="absolute -right-4 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-lg pointer-events-none" />

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-inner ring-2 ring-white/30 animate-bounce">
              <span className="material-symbols-outlined text-[24px]">notifications_active</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                  Alarm Alert
                </span>
                {item.timeLabel && (
                  <span className="text-[11px] font-semibold text-white/90">
                    {item.timeLabel}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-base text-white tracking-tight mt-0.5">
                기억할 시간이에요! 🔔
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Memo Body: Full Title, Description, Tags */}
        <div className="p-5 flex flex-col gap-3.5 max-h-[60vh] overflow-y-auto">
          {/* Memo Title */}
          <div>
            <div className="text-[11px] font-semibold text-[#887362] mb-1 flex items-center justify-between">
              <span>알림 메모</span>
              <span className="text-[10px] text-[#f78f10] font-bold">도래한 알림</span>
            </div>
            <h2 className="text-[18px] font-bold text-[#1b1c1a] leading-snug break-keep">
              {item.title}
            </h2>
          </div>

          {/* Memo Description (Full Content Display) */}
          {item.desc ? (
            <div className="bg-[#faf9f5] p-3.5 rounded-2xl border border-[#e9e8e4]">
              <div className="text-[11px] font-semibold text-[#887362] mb-1.5 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">notes</span>
                상세 내용
              </div>
              <p className="text-sm text-[#3b3a36] whitespace-pre-wrap leading-relaxed break-keep">
                {item.desc}
              </p>
            </div>
          ) : (
            <div className="bg-[#faf9f5] px-3.5 py-2.5 rounded-xl border border-[#e9e8e4] text-xs text-[#887362] italic">
              별도의 상세 내용 없이 제목으로 저장된 알림입니다.
            </div>
          )}

          {/* Timestamp Info */}
          <div className="pt-2 border-t border-[#f0eee9] flex items-center justify-between text-[11px] text-[#887362]">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px]">schedule</span>
              {item.timeLabel || '알림 시간 도래'}
            </span>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(item);
                }}
                className="text-[#f78f10] hover:text-[#d87c0e] font-semibold flex items-center gap-0.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[13px]">edit</span>
                수정하기
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 pt-2 bg-[#faf9f5] border-t border-[#efeeea] flex flex-col gap-2">
          {/* Complete Button (Primary) */}
          <button
            type="button"
            onClick={() => onComplete(item)}
            className="w-full py-3 px-4 rounded-2xl bg-[#f78f10] hover:bg-[#e07f08] active:scale-98 text-white font-bold text-sm shadow-md shadow-[#f78f10]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            지금 확인하고 완료 내역으로 이동 ✨
          </button>

          {/* Export to Native Phone Calendar (.ics) */}
          <button
            type="button"
            onClick={() => {
              exportToPhoneCalendar(item);
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-[#f0fdf4] hover:bg-[#dcfce7] active:scale-98 text-[#15803d] font-bold text-xs border border-[#bbf7d0] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="스마트폰 기본 캘린더/알람에 1초 등록"
          >
            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
            스마트폰 기본 캘린더/알람에 1초 등록 (.ics)
          </button>

          <div className="flex items-center gap-2">
            {/* Snooze 5 minutes */}
            <button
              type="button"
              onClick={() => onSnooze(item, 5)}
              className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-[#f0eee9] text-[#554335] font-semibold text-xs border border-[#dbc2ae] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#f78f10]">snooze</span>
              5분 뒤 다시 알림
            </button>

            {/* Dismiss */}
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-[#efeeea] hover:bg-[#e5e4df] text-[#554335] font-semibold text-xs transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
