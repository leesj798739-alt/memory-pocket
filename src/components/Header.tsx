import React from 'react';

interface HeaderProps {
  completedCount: number;
  trashedCount: number;
  onOpenCompleted: () => void;
  onOpenTrash: () => void;
  onOpenSettings: () => void;
  isNotifGranted: boolean;
  onShowToast: (msg: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  completedCount,
  trashedCount,
  onOpenCompleted,
  onOpenTrash,
  onOpenSettings,
  isNotifGranted,
}) => {
  return (
    <header className="sticky top-0 max-w-md w-full z-40 pt-safe bg-[#faf9f5]/90 backdrop-blur-xl shadow-[0_2px_12px_rgba(120,104,79,0.06)] border-b border-[#e9e8e4]/60">
      <div className="h-16 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[18px] text-[#1b1c1a] tracking-tight leading-none">
                기억주머니
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-medium text-[#554335]/70 tracking-wide">
                Memory Pocket
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* 휴지통 들어가는 칸 (완료 내역 좌측에 위치, 똑같은 크기 w-10 h-10) */}
          <button
            type="button"
            aria-label="휴지통 보기"
            onClick={onOpenTrash}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-[#f5f4f0] hover:bg-[#efeeea] text-[#554335] active:scale-95 transition-all cursor-pointer border border-[#e9e8e4]"
            title="휴지통 (30일 보관)"
          >
            <span className="material-symbols-outlined text-[20px] text-[#554335]">delete</span>
            {trashedCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#ba1a1a] text-white text-[10px] leading-[18px] font-bold text-center rounded-full shadow-[0_1px_4px_rgba(186,26,26,0.35)]">
                {trashedCount}
              </span>
            )}
          </button>

          {/* 완료 내역 보기 칸 (w-10 h-10) */}
          <button
            type="button"
            aria-label="완료 내역 보기"
            onClick={onOpenCompleted}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-[#f5f4f0] hover:bg-[#efeeea] text-[#554335] active:scale-95 transition-all cursor-pointer border border-[#e9e8e4]"
            title="완료 내역 (안전 보관소)"
          >
            <span className="material-symbols-outlined text-[20px]">task_alt</span>
            {completedCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-[#f78f10] text-white text-[10px] leading-[18px] font-bold text-center rounded-full shadow-[0_1px_4px_rgba(247,143,16,0.35)]">
                {completedCount}
              </span>
            )}
          </button>

          {/* 설정 칸으로 들어가는 톱니바퀴 버튼 (w-10 h-10) */}
          <button
            type="button"
            aria-label="설정"
            onClick={onOpenSettings}
            className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-[#f5f4f0] hover:bg-[#efeeea] text-[#554335] active:scale-95 transition-all cursor-pointer border border-[#e9e8e4] group"
            title="설정 (알림/진동 및 각종 설정)"
          >
            <span className="material-symbols-outlined text-[21px] text-[#554335] group-hover:rotate-45 transition-transform duration-300">
              settings
            </span>
            {!isNotifGranted && (
              <span
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#f78f10] ring-1.5 ring-white"
                title="알림 설정 필요"
              />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

