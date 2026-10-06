import React, { useState } from 'react';
import { MemoryItem } from '../types';

interface ArchiveTabProps {
  memories: MemoryItem[];
  onCompleteCard: (item: MemoryItem) => void;
  onDeleteCard: (item: MemoryItem) => void;
  onSaveInlineEdit: (id: string, newTitle: string, newDesc?: string) => void;
  onOpenPinModal: (item: MemoryItem) => void;
  onShowToast: (msg: string) => void;
}

export const ArchiveTab: React.FC<ArchiveTabProps> = ({
  memories,
  onCompleteCard,
  onDeleteCard,
  onSaveInlineEdit,
  onOpenPinModal,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

  // Real-time keyword filter
  const filteredMemories = memories.filter((memo) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    if (memo.isLocked) {
      const matchHint = (memo.lockHint || '').toLowerCase().includes(q);
      const matchCategory = (memo.category || '').toLowerCase().includes(q);
      return matchHint || matchCategory;
    }
    const matchTitle = memo.title.toLowerCase().includes(q);
    const matchDesc = memo.desc?.toLowerCase().includes(q);
    const matchCategory = memo.category?.toLowerCase().includes(q);
    return matchTitle || matchDesc || matchCategory;
  });

  const handleStartEdit = (memo: MemoryItem) => {
    if (memo.isLocked) {
      onShowToast('보안 메모는 인증 후 열람/수정 가능합니다 🔒');
      onOpenPinModal(memo);
      return;
    }
    setEditingCardId(memo.id);
    setEditTitle(memo.title);
    setEditDesc(memo.desc || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) {
      onShowToast('기억 내용을 입력해주세요');
      return;
    }
    onSaveInlineEdit(id, editTitle.trim(), editDesc.trim());
    setEditingCardId(null);
    onShowToast('수정 내용이 저장되었습니다 ✨');
  };

  const handleCancelEdit = () => {
    setEditingCardId(null);
  };

  const handleCopyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => onShowToast('복사 완료! 📋'))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    onShowToast('복사 완료! 📋');
  };

  return (
    <div className="flex flex-col w-full pb-28">
      {/* Archive Header */}
      <div className="px-4 pb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="font-bold text-[18px] text-[#1b1c1a]">보관 기억</h2>
          <p className="text-xs text-[#554335]/70">총 {memories.length}개의 기억 보관 중</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-[#f2ddbe]/60 text-[#706048] font-semibold text-xs flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">folder_special</span>
          상시 보관
        </span>
      </div>

      {/* 1-Sec Real-time Search Input */}
      <div className="px-4 mb-3">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#887362] text-[20px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="보관된 기억 검색 (예: 와이파이, 비번...)"
            className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-[#f5f4f0] text-sm text-[#1b1c1a] placeholder:text-[#887362]/70 focus:outline-none focus:bg-[#efeeea] focus:ring-1 focus:ring-[#6b5c44] transition-all shadow-inner"
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

      {/* Memory Cards List */}
      <div className="px-4 flex flex-col gap-3">
        {memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-[#f5f4f0]/80 border border-[#e9e8e4]">
            <div className="w-14 h-14 rounded-full bg-[#efeeea] flex items-center justify-center text-[#887362] mb-3">
              <span className="material-symbols-outlined text-[28px]">inventory_2</span>
            </div>
            <p className="font-bold text-[#1b1c1a] text-sm">보관해둘 기억을 적어보세요</p>
            <p className="text-[#554335]/70 text-xs mt-1">
              언제든 꺼내봐야 할 상시 정보나 비밀번호를 보관할 수 있습니다
            </p>
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl bg-[#f5f4f0]/60 border border-[#e9e8e4]">
            <span className="material-symbols-outlined text-[32px] text-[#887362] mb-2">
              search_off
            </span>
            <p className="font-bold text-[#1b1c1a] text-sm">일치하는 기억이 없습니다</p>
            <p className="text-[#554335]/70 text-xs mt-1">다른 검색어로 다시 시도해 보세요</p>
          </div>
        ) : (
          filteredMemories.map((memo) => {
            const isEditing = editingCardId === memo.id;

            return (
              <div
                key={memo.id}
                className={`bg-white p-4 rounded-2xl shadow-[0_1px_3px_rgba(20,11,14,0.03),0_4px_12px_rgba(120,104,79,0.05)] border ${
                  memo.isLocked ? 'border-[#6b5c44]/30' : 'border-[#e9e8e4]'
                } flex flex-col gap-2.5 transition-all`}
              >
                {/* Header row: category badge & complete button */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                        memo.isLocked
                          ? 'bg-[#1b1c1a] text-white flex items-center gap-1'
                          : 'bg-[#f2ddbe] text-[#706048]'
                      }`}
                    >
                      {memo.isLocked && (
                        <span className="material-symbols-outlined text-[13px] text-[#f78f10]">
                          lock
                        </span>
                      )}
                      {memo.category && memo.category !== '없음'
                        ? memo.category
                        : '상시 보관'}
                    </span>
                    {memo.isLocked && (
                      <span className="px-1.5 py-0.5 rounded bg-[#f2ddbe]/60 text-[10px] text-[#706048] font-semibold">
                        PIN 보호됨
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    aria-label="완료 체크"
                    onClick={() => onCompleteCard(memo)}
                    className="w-8 h-8 rounded-full bg-[#1b1c1a] hover:bg-[#6b5c44] text-white flex items-center justify-center shadow-sm active:scale-90 transition-all cursor-pointer flex-shrink-0"
                    title="완료 및 보관 처리"
                  >
                    <span className="material-symbols-outlined text-[18px] text-white">check</span>
                  </button>
                </div>

                {/* Content Area (Inline Edit Mode vs Display Mode) */}
                {isEditing ? (
                  <div className="flex flex-col gap-2 pt-1">
                    <textarea
                      rows={3}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="기억 내용 (여러 줄·문단 입력 가능)"
                      className="w-full min-h-[84px] p-3 rounded-xl bg-[#f5f4f0] text-sm text-[#1b1c1a] font-semibold focus:outline-none focus:ring-2 focus:ring-[#6b5c44] resize-y break-words whitespace-pre-wrap leading-relaxed"
                      autoFocus
                    />
                    <textarea
                      rows={2}
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="상세 설명 (선택)"
                      className="w-full min-h-[64px] p-2.5 rounded-xl bg-[#f5f4f0] text-xs text-[#1b1c1a] focus:outline-none focus:ring-2 focus:ring-[#6b5c44] resize-y break-words whitespace-pre-wrap leading-relaxed"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 rounded-xl bg-[#efeeea] hover:bg-[#e9e8e4] text-xs font-semibold text-[#554335] active:scale-95 transition-all"
                      >
                        취소
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(memo.id)}
                        className="px-4 py-1.5 rounded-xl bg-[#6b5c44] hover:bg-[#594d38] text-white text-xs font-bold shadow-sm active:scale-95 transition-all flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">check</span>
                        저장
                      </button>
                    </div>
                  </div>
                ) : memo.isLocked ? (
                  /* Protected Secure Content: PIN 풀기 전에는 오직 lockHint 설명만 표시되고 기억 내용과 상세 메모는 **** 로 숨김 */
                  <div
                    onClick={() => onOpenPinModal(memo)}
                    className="flex items-center justify-between gap-3 py-2 px-3 -mx-1 rounded-xl bg-[#faf9f5] border border-[#dbc2ae]/60 hover:bg-[#f5f4f0] cursor-pointer transition-all group"
                  >
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-[15px] text-[#1b1c1a] leading-snug break-words">
                        {memo.lockHint || '보안 메모'}
                      </span>
                      <p className="font-mono text-xs tracking-widest text-[#887362] font-extrabold flex items-center gap-1.5 mt-1">
                        <span className="material-symbols-outlined text-[15px] text-[#8e4f00]">
                          lock
                        </span>
                        ••••••••
                        <span className="text-[10px] font-sans font-normal text-[#887362]/80 ml-1">
                          (PIN 입력 후 열람)
                        </span>
                      </p>
                    </div>
                    <button
                      type="button"
                      className="px-3.5 py-2 rounded-xl bg-[#6b5c44] group-hover:bg-[#594d38] text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">key</span>
                      열람
                    </button>
                  </div>
                ) : (
                  /* Normal Content */
                  <div className="flex flex-col">
                    <p className="font-bold text-[15px] text-[#1b1c1a] leading-relaxed break-words whitespace-pre-wrap">
                      {memo.title}
                    </p>
                    {memo.desc && (
                      <p className="text-xs text-[#554335]/80 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                        {memo.desc}
                      </p>
                    )}
                  </div>
                )}

                {/* Footer Actions (Copy, Inline Edit, Safe Delete) */}
                {!isEditing && (
                  <div className="flex items-center justify-between pt-1 text-[#554335] border-t border-[#efeeea]">
                    {memo.isLocked ? (
                      <button
                        type="button"
                        onClick={() => onOpenPinModal(memo)}
                        className="text-[11px] text-[#887362] hover:text-[#1b1c1a] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#efeeea] transition-colors cursor-pointer"
                        title="PIN 인증 후 복사"
                      >
                        <span className="material-symbols-outlined text-[13px]">lock</span>
                        인증 후 복사
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(memo.desc ? `${memo.title}\n${memo.desc}` : memo.title)}
                        className="text-[11px] text-[#887362] hover:text-[#1b1c1a] flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[#efeeea] transition-colors cursor-pointer"
                        title="내용 복사"
                      >
                        <span className="material-symbols-outlined text-[13px]">content_copy</span>
                        복사
                      </button>
                    )}

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(memo)}
                        className="px-2.5 py-1 rounded-lg bg-[#f5f4f0] hover:bg-[#efeeea] text-[#554335] text-xs font-medium flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[13px]">edit</span>
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCard(memo)}
                        className="px-2.5 py-1 rounded-lg bg-[#f5f4f0] hover:bg-[#ffdad6] text-[#887362] hover:text-[#ba1a1a] text-xs font-medium flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                        title="안전 삭제 (완료 내역으로 보관)"
                      >
                        <span className="material-symbols-outlined text-[13px]">delete</span>
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
