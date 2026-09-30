import React, { useState } from 'react';
import { CompletedFilterType, MemoryItem } from '../types';
import { formatRelativeTime } from '../utils/storage';

interface CompletedViewProps {
  completedMemories: MemoryItem[];
  onBackToMain: () => void;
  onRestoreMemory: (item: MemoryItem) => void;
  onDeleteMemory: (item: MemoryItem) => void;
}

export const CompletedView: React.FC<CompletedViewProps> = ({
  completedMemories,
  onBackToMain,
  onRestoreMemory,
  onDeleteMemory,
}) => {
  const [filter, setFilter] = useState<CompletedFilterType>('all');

  const notifCount = completedMemories.filter((m) => m.completedOrigin === 'notification').length;
  const archiveCount = completedMemories.filter((m) => m.completedOrigin === 'archive').length;
  const totalCount = completedMemories.length;

  const filteredMemories = completedMemories.filter((memo) => {
    if (filter === 'notification') return memo.completedOrigin === 'notification';
    if (filter === 'archive') return memo.completedOrigin === 'archive';
    return true;
  });

  return (
    <div className="flex flex-col w-full min-h-screen pb-16 bg-[#faf9f5]">
      {/* Top Bar */}
      <section className="px-4 pt-3 pb-3">
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={onBackToMain}
            className="flex items-center gap-1 py-1.5 px-2.5 -ml-1 rounded-xl text-[#6b5c44] hover:bg-[#efeeea] active:scale-95 transition-all cursor-pointer font-semibold text-xs border border-[#e9e8e4]"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back_ios</span>
            <span>메인으로</span>
          </button>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#e9e8e4] rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#f78f10]"></span>
            <span className="text-xs text-[#554335] font-bold">
              총 {filter === 'all' ? totalCount : filter === 'notification' ? notifCount : archiveCount}건
            </span>
          </div>
        </div>

        {/* Friendly Vault Atmosphere Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#f5f4f0] via-[#efeeea] to-[#f2ddbe]/30 border border-[#e9e8e4] shadow-xs relative overflow-hidden">
          <div className="relative z-10 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-1 mb-1 text-[#8e4f00]">
                <span className="material-symbols-outlined text-[16px]">verified_user</span>
                <span className="text-[10px] uppercase tracking-wider font-extrabold">
                  Safe Archive & Recovery
                </span>
              </div>
              <h2 className="font-bold text-[18px] text-[#1b1c1a] tracking-tight">안전 보관소</h2>
              <p className="text-xs text-[#554335]/80 mt-0.5">
                완료되거나 비워낸 기억들이 안전하게 머무는 곳
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center text-[#8e4f00] shadow-xs shrink-0 border border-[#e9e8e4]">
              <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Category Tabs (Equal 3-Way Distribution) */}
      <section className="px-4 mb-3">
        <nav
          aria-label="출처별 필터"
          className="p-1 bg-[#efeeea] rounded-2xl grid grid-cols-3 gap-1 border border-[#dbc2ae]/30"
          role="tablist"
        >
          {/* 전체 */}
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => setFilter('all')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 font-bold text-xs transition-all duration-200 cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-[#8e4f00] shadow-xs'
                : 'text-[#554335] hover:text-[#1b1c1a]'
            }`}
          >
            <span>전체</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filter === 'all' ? 'bg-[#ffdcc1] text-[#8e4f00]' : 'bg-[#e9e8e4] text-[#554335]'
              }`}
            >
              {totalCount}
            </span>
          </button>

          {/* 알림 */}
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'notification'}
            onClick={() => setFilter('notification')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 font-bold text-xs transition-all duration-200 cursor-pointer ${
              filter === 'notification'
                ? 'bg-[#fef0e3] text-[#f78f10] shadow-xs border border-[#f78f10]/30'
                : 'text-[#554335] hover:text-[#1b1c1a]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">notifications</span>
            <span>알림</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filter === 'notification' ? 'bg-[#f78f10] text-white' : 'bg-[#e9e8e4] text-[#554335]'
              }`}
            >
              {notifCount}
            </span>
          </button>

          {/* 보관 */}
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'archive'}
            onClick={() => setFilter('archive')}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1 font-bold text-xs transition-all duration-200 cursor-pointer ${
              filter === 'archive'
                ? 'bg-[#f2ddbe] text-[#706048] shadow-xs border border-[#706048]/30'
                : 'text-[#554335] hover:text-[#1b1c1a]'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">folder</span>
            <span>보관</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filter === 'archive' ? 'bg-[#706048] text-white' : 'bg-[#e9e8e4] text-[#554335]'
              }`}
            >
              {archiveCount}
            </span>
          </button>
        </nav>
      </section>

      {/* Completed & Deleted Items Stack */}
      <section className="px-4 flex flex-col gap-3">
        {filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-14 px-4 rounded-2xl bg-[#f5f4f0] border border-[#e9e8e4]">
            <div className="w-12 h-12 rounded-full bg-[#efeeea] flex items-center justify-center text-[#887362] mb-3">
              <span className="material-symbols-outlined text-[24px]">task</span>
            </div>
            <p className="font-bold text-sm text-[#1b1c1a]">
              {filter === 'notification'
                ? '완료된 알림이 없습니다'
                : filter === 'archive'
                ? '비워낸 보관 메모가 없습니다'
                : '완료 내역이 없습니다'}
            </p>
            <p className="text-xs text-[#554335]/70 mt-1">
              완료하거나 비운 기억이 이곳에 안전하게 정돈됩니다
            </p>
          </div>
        ) : (
          filteredMemories.map((memo) => {
            const isNotif = memo.completedOrigin === 'notification';
            const actionText =
              memo.completedReason === 'deleted'
                ? `${formatRelativeTime(memo.completedAt)} 안전 삭제됨`
                : `${formatRelativeTime(memo.completedAt)} 완료`;

            return (
              <article
                key={memo.id}
                className="p-4 rounded-2xl bg-white shadow-xs border border-[#e9e8e4] flex flex-col gap-2.5 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        isNotif
                          ? 'bg-[#f78f10]/15 text-[#f78f10]'
                          : 'bg-[#f2ddbe] text-[#706048]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {isNotif ? 'notifications_active' : 'folder'}
                      </span>
                      {isNotif ? '알림' : '보관'}
                    </span>
                    <span className="text-[11px] text-[#887362]">{actionText}</span>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-[#887362]/60">
                    {isNotif ? 'task_alt' : 'archive'}
                  </span>
                </div>

                <div className="pr-1">
                  {memo.isLocked ? (
                    <>
                      <h3 className="font-semibold text-sm text-[#887362] leading-relaxed line-through break-words whitespace-pre-wrap flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-[#8e4f00]">lock</span>
                        <span>{memo.lockHint || '보안 메모'}</span>
                      </h3>
                      <p className="font-mono text-xs tracking-widest text-[#887362]/70 mt-0.5">
                        •••••••• (보안 잠금됨)
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold text-sm text-[#887362] leading-relaxed line-through break-words whitespace-pre-wrap">
                        {memo.title}
                      </h3>
                      {memo.desc && (
                        <p className="text-xs text-[#887362]/70 mt-0.5 line-through break-words whitespace-pre-wrap">
                          {memo.desc}
                        </p>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#efeeea]">
                  <button
                    type="button"
                    onClick={() => onRestoreMemory(memo)}
                    className="h-9 px-3 rounded-xl bg-[#f5f4f0] hover:bg-[#f2ddbe]/50 active:scale-95 text-[#6b5c44] flex items-center gap-1.5 transition-all cursor-pointer font-bold text-xs"
                    title={`${isNotif ? '알림' : '보관'} 탭으로 복구`}
                  >
                    <span className="material-symbols-outlined text-[16px]">undo</span>
                    <span>되돌리기</span>
                  </button>

                  <button
                    type="button"
                    aria-label="휴지통으로 이동"
                    onClick={() => onDeleteMemory(memo)}
                    className="w-9 h-9 rounded-xl bg-[#f5f4f0] hover:bg-[#ffdad6] active:scale-95 text-[#887362] hover:text-[#ba1a1a] flex items-center justify-center transition-all cursor-pointer"
                    title="휴지통으로 이동 (30일간 보관)"
                  >
                    <span className="material-symbols-outlined text-[17px]">delete</span>
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* Visual Delight & Assurance Banner */}
      <section className="px-4 mt-6">
        <div className="p-4 rounded-2xl bg-[#f5f4f0] border border-[#e9e8e4] flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-xl bg-[#ffdcc1] flex items-center justify-center text-[#f78f10] shrink-0 mt-0.5">
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              lightbulb
            </span>
          </div>
          <div className="flex-1">
            <p className="text-xs text-[#554335] leading-relaxed break-keep">
              <strong className="font-bold text-[#1b1c1a]">기억은 지워지지 않아요.</strong>
              <br />
              '되돌리기' 버튼으로 원래 주머니로 복구할 수 있으며, 삭제한 기억도{' '}
              <span className="text-[#8e4f00] font-bold">휴지통(30일 보관)</span>으로 안전하게 이동되어 언제든 다시 되살릴 수 있어요.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
