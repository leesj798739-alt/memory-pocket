import React, { useState } from 'react';
import { MemoryItem } from '../types';
import { getRemainingTrashDays, formatRelativeTime } from '../utils/storage';

interface TrashViewProps {
  trashedMemories: MemoryItem[];
  onBack: () => void;
  onRestoreItem: (item: MemoryItem) => void;
  onRestoreSelected: (ids: string[]) => void;
  onPermanentDeleteItem: (id: string) => void;
  onPermanentDeleteSelected: (ids: string[]) => void;
  onEmptyTrash: () => void;
}

export const TrashView: React.FC<TrashViewProps> = ({
  trashedMemories,
  onBack,
  onRestoreItem,
  onRestoreSelected,
  onPermanentDeleteItem,
  onPermanentDeleteSelected,
  onEmptyTrash,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    mode: 'single' | 'selected' | 'all';
    targetId?: string;
  }>({
    isOpen: false,
    mode: 'single',
  });

  const isAllSelected =
    trashedMemories.length > 0 && selectedIds.size === trashedMemories.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(trashedMemories.map((m) => m.id)));
    }
  };

  const handleToggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleExecuteDeleteConfirm = () => {
    if (confirmDialog.mode === 'single' && confirmDialog.targetId) {
      onPermanentDeleteItem(confirmDialog.targetId);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(confirmDialog.targetId!);
        return next;
      });
    } else if (confirmDialog.mode === 'selected') {
      onPermanentDeleteSelected(Array.from(selectedIds));
      setSelectedIds(new Set());
    } else if (confirmDialog.mode === 'all') {
      onEmptyTrash();
      setSelectedIds(new Set());
    }
    setConfirmDialog({ isOpen: false, mode: 'single' });
  };

  const handleBatchRestore = () => {
    if (selectedIds.size === 0) return;
    onRestoreSelected(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#faf9f5] pb-24 animate-in fade-in duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-30 pt-safe bg-[#faf9f5]/95 backdrop-blur-md border-b border-[#e9e8e4]/70 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 -ml-1 rounded-xl hover:bg-[#efeeea] flex items-center justify-center text-[#554335] active:scale-95 transition-all cursor-pointer"
            title="메인으로 돌아가기"
          >
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[19px] text-[#ba1a1a]">delete</span>
              <h1 className="font-bold text-[17px] text-[#1b1c1a]">휴지통</h1>
              <span className="px-1.5 py-0.5 rounded-full bg-[#ba1a1a]/10 text-[#ba1a1a] text-[11px] font-bold">
                {trashedMemories.length}
              </span>
            </div>
          </div>
        </div>

        {trashedMemories.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirmDialog({ isOpen: true, mode: 'all' })}
            className="px-2.5 py-1.5 rounded-xl bg-[#ba1a1a]/10 hover:bg-[#ba1a1a]/15 text-[#ba1a1a] text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
            <span>휴지통 비우기</span>
          </button>
        )}
      </header>

      {/* 30-Day Auto Purge Notification Banner */}
      <div className="px-4 pt-3 pb-2">
        <div className="p-3 rounded-2xl bg-[#f5f4f0] border border-[#e9e8e4] flex items-start gap-2.5 shadow-2xs">
          <span className="material-symbols-outlined text-[18px] text-[#8e4f00] shrink-0 mt-0.5">
            schedule
          </span>
          <div className="flex flex-col text-xs">
            <span className="font-bold text-[#1b1c1a]">30일 자동 삭제 보관 정책</span>
            <span className="text-[#6b5c44] mt-0.5 leading-relaxed">
              휴지통에 들어온 기억은 <strong>30일 동안 보관</strong>된 후 자동으로 영구 삭제됩니다. 필요시 언제든 원래 탭으로 복구할 수 있습니다.
            </span>
          </div>
        </div>
      </div>

      {/* Batch Action Toolbar */}
      {trashedMemories.length > 0 && (
        <div className="px-4 py-2 flex items-center justify-between border-b border-[#e9e8e4]/60 bg-[#faf9f5]">
          {/* Select All Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleToggleSelectAll}
              className="w-4 h-4 rounded text-[#f78f10] focus:ring-0 focus:outline-none cursor-pointer"
            />
            <span className="text-xs font-semibold text-[#554335]">
              전체 선택 ({selectedIds.size}/{trashedMemories.length})
            </span>
          </label>

          {/* Action Buttons for selected items */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={handleBatchRestore}
              className="px-2.5 py-1 rounded-lg bg-[#f2ddbe]/80 hover:bg-[#f2ddbe] text-[#8e4f00] text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">undo</span>
              <span>선택 복구{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}</span>
            </button>

            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setConfirmDialog({ isOpen: true, mode: 'selected' })}
              className="px-2.5 py-1 rounded-lg bg-[#ba1a1a]/10 hover:bg-[#ba1a1a]/20 text-[#ba1a1a] text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">delete_forever</span>
              <span>선택 삭제{selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}</span>
            </button>
          </div>
        </div>
      )}

      {/* Trashed Memory Cards List */}
      <div className="px-4 pt-3 flex flex-col gap-3">
        {trashedMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center rounded-2xl bg-[#f5f4f0]/70 border border-[#e9e8e4]">
            <div className="w-14 h-14 rounded-full bg-[#efeeea] flex items-center justify-center text-[#887362] mb-3">
              <span className="material-symbols-outlined text-[28px]">delete_outline</span>
            </div>
            <p className="font-bold text-[#1b1c1a] text-sm">휴지통이 비어 있습니다</p>
            <p className="text-[#554335]/70 text-xs mt-1">
              삭제한 기억은 30일간 이곳에 안전하게 보관됩니다
            </p>
          </div>
        ) : (
          trashedMemories.map((memo) => {
            const isChecked = selectedIds.has(memo.id);
            const daysLeft = getRemainingTrashDays(memo.deletedAt);
            const isOriginNotif = memo.deletedOrigin === 'notification' || memo.type === 'notification';

            return (
              <div
                key={memo.id}
                className={`p-3.5 rounded-2xl bg-white border transition-all shadow-xs flex flex-col gap-2.5 ${
                  isChecked
                    ? 'border-[#f78f10] ring-1 ring-[#f78f10]/30'
                    : 'border-[#e9e8e4] hover:border-[#dbc2ae]'
                }`}
              >
                {/* Header row: Checkbox + Origin Badge + Remaining Days Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleItem(memo.id)}
                      className="w-4 h-4 rounded text-[#f78f10] focus:ring-0 focus:outline-none cursor-pointer"
                    />
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isOriginNotif
                          ? 'bg-[#fef0e3] text-[#8e4f00] border border-[#f78f10]/30'
                          : 'bg-[#efeeea] text-[#554335] border border-[#dbc2ae]/40'
                      }`}
                    >
                      {isOriginNotif ? '알림' : '보관'}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-[#ba1a1a]/10 text-[#ba1a1a] text-[10px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">timer</span>
                    {daysLeft}일 후 영구 삭제
                  </span>
                </div>

                {/* Content with auto line-wrap */}
                <div className="pl-6">
                  {memo.isLocked ? (
                    <>
                      <h3 className="font-semibold text-sm text-[#1b1c1a] leading-relaxed break-words whitespace-pre-wrap flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-[#8e4f00]">lock</span>
                        <span>{memo.lockHint || '보안 메모'}</span>
                      </h3>
                      <p className="font-mono text-xs tracking-widest text-[#887362] mt-0.5">
                        •••••••• (보안 잠금됨)
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="font-semibold text-sm text-[#1b1c1a] leading-relaxed break-words whitespace-pre-wrap">
                        {memo.title}
                      </h3>
                      {memo.desc && (
                        <p className="text-xs text-[#554335]/70 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                          {memo.desc}
                        </p>
                      )}
                    </>
                  )}
                  <span className="text-[10px] text-[#887362] mt-1.5 block">
                    삭제: {formatRelativeTime(memo.deletedAt)}
                  </span>
                </div>

                {/* Footer Action Buttons: 복구 & 영구 삭제 */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#efeeea]">
                  <button
                    type="button"
                    onClick={() => onRestoreItem(memo)}
                    className="px-3 py-1.5 rounded-xl bg-[#f2ddbe]/70 hover:bg-[#f2ddbe] text-[#8e4f00] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    title="원래 탭으로 복구"
                  >
                    <span className="material-symbols-outlined text-[15px]">undo</span>
                    <span>복구</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmDialog({ isOpen: true, mode: 'single', targetId: memo.id })}
                    className="px-3 py-1.5 rounded-xl bg-[#ba1a1a]/10 hover:bg-[#ba1a1a]/20 text-[#ba1a1a] text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                    title="영구 삭제"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete_forever</span>
                    <span>영구 삭제</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal for Permanent Deletion */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-xs bg-white rounded-2xl p-5 shadow-2xl border border-[#e9e8e4] flex flex-col gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ba1a1a]/10 text-[#ba1a1a] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>

            <div className="text-center">
              <h3 className="font-bold text-sm text-[#1b1c1a]">
                {confirmDialog.mode === 'all'
                  ? '휴지통을 모두 비우시겠습니까?'
                  : confirmDialog.mode === 'selected'
                  ? `선택한 ${selectedIds.size}개 기억을 영구 삭제하시겠습니까?`
                  : '이 기억을 영구 삭제하시겠습니까?'}
              </h3>
              <p className="text-xs text-[#887362] mt-1 leading-relaxed">
                영구 삭제된 기억은 다시 복구할 수 없습니다.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, mode: 'single' })}
                className="flex-1 py-2.5 rounded-xl bg-[#efeeea] text-[#554335] text-xs font-bold hover:bg-[#e3e2df] transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteConfirm}
                className="flex-1 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-xs font-bold hover:bg-[#991b1b] shadow-xs transition-colors cursor-pointer"
              >
                영구 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
