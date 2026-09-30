import React, { useState, useEffect } from 'react';
import { MemoryItem } from '../types';
import { exportToPhoneCalendar } from '../utils/calendar';
import { sound } from '../utils/sound';

interface NotificationTabProps {
  memories: MemoryItem[];
  highlightedCardId: string | null;
  onCompleteCard: (item: MemoryItem) => void;
  onDeleteCard: (item: MemoryItem) => void;
  onEditCard: (item: MemoryItem) => void;
  onTriggerAlarmPreview: (item: MemoryItem) => void;
  onShowToast?: (msg: string) => void;
}

export const NotificationTab: React.FC<NotificationTabProps> = ({
  memories,
  highlightedCardId,
  onCompleteCard,
  onDeleteCard,
  onEditCard,
  onTriggerAlarmPreview,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  // 1-second interval to update remaining countdowns in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format countdown: 몇 초, 몇 분, 몇 시간, 며칠 남았는지 계산
  const getCountdownInfo = (notifyAt?: number) => {
    if (!notifyAt) return null;
    const diffMs = notifyAt - currentTime;
    if (diffMs <= 0) {
      return {
        text: '시간 도래',
        isPast: true,
        isUrgent: true,
      };
    }

    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
      return {
        text: `${diffSec}초 남음`,
        isPast: false,
        isUrgent: true,
      };
    }
    if (diffMin < 60) {
      const secRemainder = diffSec % 60;
      const text = diffMin < 5 && secRemainder > 0
        ? `${diffMin}분 ${secRemainder}초 남음`
        : `${diffMin}분 남음`;
      return {
        text,
        isPast: false,
        isUrgent: diffMin < 15,
      };
    }
    if (diffHour < 24) {
      const minRemainder = diffMin % 60;
      const text = minRemainder > 0 ? `${diffHour}시간 ${minRemainder}분 남음` : `${diffHour}시간 남음`;
      return {
        text,
        isPast: false,
        isUrgent: false,
      };
    }
    const hourRemainder = diffHour % 24;
    const text = hourRemainder > 0 ? `${diffDay}일 ${hourRemainder}시간 남음` : `${diffDay}일 남음`;
    return {
      text,
      isPast: false,
      isUrgent: false,
    };
  };

  // Sort: Items with upcoming notifyAt first (closest upcoming first), then none mode at bottom
  const sortedMemories = [...memories].sort((a, b) => {
    const aHasTime = a.notifyMode !== 'none' && !!a.notifyAt;
    const bHasTime = b.notifyMode !== 'none' && !!b.notifyAt;

    if (aHasTime && bHasTime) {
      return (a.notifyAt || 0) - (b.notifyAt || 0);
    }
    if (aHasTime && !bHasTime) return -1;
    if (!aHasTime && bHasTime) return 1;
    return b.createdAt - a.createdAt;
  });

  // Real-time search filtering on sorted notification memories
  const filteredMemories = sortedMemories.filter((memo) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchTitle = memo.title.toLowerCase().includes(q);
    const matchDesc = memo.desc?.toLowerCase().includes(q);
    const matchTags = memo.tags.some((t) => t.toLowerCase().includes(q));
    const matchTime = memo.timeLabel?.toLowerCase().includes(q);
    return matchTitle || matchDesc || matchTags || matchTime;
  });

  return (
    <div className="flex flex-col w-full pb-28">
      {/* Notification Header (보관 기억과 동일한 디자인 & 타이틀) */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="font-bold text-[18px] text-[#1b1c1a]">알림 기억</h2>
          <div className="flex items-center gap-1.5 text-xs text-[#554335]/80 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f78f10] animate-pulse"></span>
            <span>
              오늘 예정된 알림 <strong className="text-[#8e4f00] font-bold">{memories.length}건</strong> 남음
            </span>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#fef0e3] text-[#f78f10] border border-[#f78f10]/30 font-semibold text-xs flex items-center gap-1 shadow-2xs">
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            alarm
          </span>
          시한성 알림
        </span>
      </div>

      {/* 1-Sec Real-time Search Input for Notification memories */}
      <div className="px-4 mb-3">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#887362] text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="알림 설정된 기억 검색 (예: 주차, 패딩, 서류...)"
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#f5f4f0] text-sm text-[#1b1c1a] placeholder:text-[#887362]/70 focus:outline-none focus:bg-[#efeeea] focus:ring-1 focus:ring-[#f78f10] transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#e9e8e4] hover:bg-[#dbdad6] text-[#554335] flex items-center justify-center transition-colors cursor-pointer"
              title="검색어 지우기"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Central Memory Cards List */}
      <div className="px-4 flex flex-col gap-3" id="memory-cards-container">
        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-[#f5f4f0]/80 border border-[#e9e8e4]">
            <div className="w-14 h-14 rounded-full bg-[#efeeea] flex items-center justify-center text-[#887362] mb-3">
              <span className="material-symbols-outlined text-[28px]">notifications_none</span>
            </div>
            <p className="font-bold text-[#1b1c1a] text-sm">지금 등록된 알림이 없습니다</p>
            <p className="text-[#554335]/70 text-xs mt-1">
              아래 버튼을 눌러 기억해 둘 리마인드를 등록해 보세요
            </p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-[#f5f4f0]/60 border border-[#e9e8e4]">
            <span className="material-symbols-outlined text-[32px] text-[#887362] mb-2">
              search_off
            </span>
            <p className="font-bold text-[#1b1c1a] text-sm">일치하는 알림 기억이 없습니다</p>
            <p className="text-[#554335]/70 text-xs mt-1">다른 검색어로 다시 시도해 보세요</p>
          </div>
        ) : (
          filteredMemories.map((memo, index) => {
            const isImminent = index === 0 && memo.notifyMode !== 'none';
            const isHighlighted = highlightedCardId === memo.id;
            const countdown = memo.notifyMode !== 'none' ? getCountdownInfo(memo.notifyAt) : null;

            return (
              <div
                key={memo.id}
                id={`card-${memo.id}`}
                className={`relative bg-white rounded-2xl p-4 transition-all duration-300 transform group overflow-hidden border ${
                  isHighlighted
                    ? 'ring-2 ring-[#f78f10] shadow-lg shadow-[#f78f10]/20 scale-[1.01]'
                    : isImminent
                    ? 'border-[#f78f10]/30 shadow-[0_2px_12px_rgba(247,143,16,0.12)]'
                    : 'border-[#e9e8e4] shadow-[0_1px_3px_rgba(20,11,14,0.03),0_4px_12px_rgba(120,104,79,0.04)]'
                }`}
              >
                {/* Visual Accent bar on the left for imminent notifications */}
                {isImminent && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#f78f10]"></div>
                )}

                <div className={`flex items-start justify-between gap-3 ${isImminent ? 'pl-1' : ''}`}>
                  <div className="flex-1 min-w-0">
                    {/* Time Badge and Status */}
                    <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                      {memo.notifyMode === 'none' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#efeeea] text-[#887362] text-[11px] font-medium">
                          <span className="material-symbols-outlined text-[12px] leading-none">
                            notifications_off
                          </span>
                          알림 없음
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onTriggerAlarmPreview(memo)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-transform active:scale-95 cursor-pointer ${
                            isImminent
                              ? 'bg-[#f78f10] text-white shadow-xs'
                              : 'bg-[#f2ddbe]/70 text-[#706048]'
                          }`}
                          title="터치하여 알림 배너 다시 보기"
                        >
                          <span
                            className="material-symbols-outlined text-[12px] leading-none"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            alarm
                          </span>
                          {memo.timeLabel || '시간 설정됨'}
                        </button>
                      )}

                      {/* 알림까지 남은 시간 초소형 뱃지 (테두리 없음, 모래시계 아이콘 없음) */}
                      {countdown && (
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[9.5px] font-bold tracking-tight transition-colors ${
                            countdown.isPast
                              ? 'bg-[#efeeea] text-[#887362]'
                              : isImminent || countdown.isUrgent
                              ? 'bg-[#fef0e3] text-[#f78f10]'
                              : 'bg-[#f5f4f0] text-[#706048]'
                          }`}
                        >
                          {isImminent && !countdown.isPast && (
                            <span className="font-extrabold mr-0.5">마감 임박 ·</span>
                          )}
                          <span>{countdown.text}</span>
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-[15px] text-[#1b1c1a] leading-relaxed break-words whitespace-pre-wrap">
                      {memo.title}
                    </h3>

                    {/* Description */}
                    {memo.desc && (
                      <p className="text-xs text-[#554335]/80 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                        {memo.desc}
                      </p>
                    )}
                  </div>

                  {/* One-Click Completion Check Button */}
                  <button
                    type="button"
                    aria-label="완료 체크"
                    onClick={() => onCompleteCard(memo)}
                    className="w-9 h-9 rounded-full bg-[#1b1c1a] hover:bg-[#8e4f00] text-white flex items-center justify-center transition-all duration-200 active:scale-90 flex-shrink-0 shadow-sm cursor-pointer"
                    title="터치하여 완료하기"
                  >
                    <span className="material-symbols-outlined text-[20px] text-white">check</span>
                  </button>
                </div>

                {/* Footer: Tags and Action Buttons */}
                <div
                  className={`mt-3 pt-2.5 flex items-center justify-between text-[#887362] border-t border-[#efeeea] ${
                    isImminent ? 'pl-1' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {memo.tags && memo.tags.length > 0 ? (
                      memo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 rounded-md bg-[#f5f4f0] text-xs text-[#554335] font-medium"
                        >
                          #{tag.replace(/^#/, '')}
                        </span>
                      ))
                    ) : (
                      <span className="px-2 py-0.5 rounded-md bg-[#f5f4f0] text-xs text-[#554335]">
                        #기억
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {memo.notifyAt && memo.notifyAt > Date.now() && (
                      <button
                        type="button"
                        onClick={() => {
                          sound.playClick();
                          const success = exportToPhoneCalendar(memo);
                          if (success && onShowToast) {
                            onShowToast('스마트폰 캘린더/알람 파일이 생성되었습니다 📅');
                          }
                        }}
                        className="h-7 px-2 rounded-lg bg-[#f0fdf4] hover:bg-[#dcfce7] active:scale-95 text-[#15803d] border border-[#bbf7d0] flex items-center gap-1 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
                        title="스마트폰 기본 캘린더/알람에 1초 등록 (.ics)"
                      >
                        <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                        <span>캘린더</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onEditCard(memo)}
                      className="w-7 h-7 rounded-lg hover:bg-[#efeeea] text-[#554335] flex items-center justify-center transition-colors cursor-pointer"
                      title="수정"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteCard(memo)}
                      className="w-7 h-7 rounded-lg hover:bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center transition-colors cursor-pointer"
                      title="안전 삭제 (완료 내역으로 이동)"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
