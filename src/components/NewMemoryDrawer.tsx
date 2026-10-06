import React, { useState, useEffect, useRef } from 'react';
import { TabType, NotificationMode, MemoryItem } from '../types';
import { CalendarDatePicker } from './CalendarDatePicker';
import {
  getAvailableCategories,
  addCustomCategory,
} from '../utils/storage';
import {
  getNotificationPermissionState,
  requestNotificationPermission,
} from '../utils/notification';

interface NewMemoryDrawerProps {
  isOpen: boolean;
  activeTab: TabType;
  onClose: () => void;
  onSubmit: (newItem: Omit<MemoryItem, 'id' | 'createdAt'>) => void;
  onShowToast: (msg: string) => void;
}

export const NewMemoryDrawer: React.FC<NewMemoryDrawerProps> = ({
  isOpen,
  activeTab,
  onClose,
  onSubmit,
  onShowToast,
}) => {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  // Notification Mode state
  const [notifyMode, setNotifyMode] = useState<NotificationMode>('relative');
  const [relativeMinutes, setRelativeMinutes] = useState<number>(30);
  const [customMinutes, setCustomMinutes] = useState<string>('');

  // Calendar mode state (2026~2050 accurate calendar support)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [activeDatePreset, setActiveDatePreset] = useState<'오늘' | '내일' | '모레' | '1주 뒤' | 'custom'>('오늘');
  const [ampm, setAmpm] = useState<'오전' | '오후'>('오후');
  const [hour, setHour] = useState<string>('03');
  const [minute, setMinute] = useState<string>('30');

  // Dynamic Categories with '없음' & '추가'
  const [availableCategories, setAvailableCategories] = useState<string[]>(() => getAvailableCategories());
  const [selectedCategory, setSelectedCategory] = useState<string>('자주 찾는 정보');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Archive Mode: Custom User-defined PIN protection
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [pinBuffer, setPinBuffer] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [lockHint, setLockHint] = useState('');
  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDesc('');
      setIsAddingCategory(false);
      setNewCategoryInput('');
      setAvailableCategories(getAvailableCategories());
      setSelectedCategory('자주 찾는 정보');
      setIsPinEnabled(false);
      setPinBuffer('');
      setShowPin(false);
      setLockHint('');
      setNotifyMode(activeTab === 'notification' ? 'relative' : 'none');
      const now = new Date();
      setSelectedDate(now);
      setActiveDatePreset('오늘');
      setHour(String(now.getHours() % 12 || 12).padStart(2, '0'));
      setMinute(now.getMinutes() < 30 ? '30' : '00');
      setAmpm(now.getHours() >= 12 ? '오후' : '오전');
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Add custom category handler
  const handleAddNewCategory = () => {
    const trimmed = newCategoryInput.replace(/^#/, '').trim();
    if (!trimmed) {
      onShowToast('추가할 카테고리 이름을 입력해주세요');
      return;
    }
    if (trimmed === '없음') {
      onShowToast("'없음'은 카테고리명으로 추가할 수 없습니다");
      return;
    }
    const updated = addCustomCategory(trimmed);
    setAvailableCategories(updated);
    setSelectedCategory(trimmed);
    setNewCategoryInput('');
    setIsAddingCategory(false);
    onShowToast(`카테고리 #${trimmed} 추가됨! ✨`);
  };

  // Keypad press handlers for custom PIN
  const handleKeypadPress = (digit: string) => {
    if (pinBuffer.length < 4) {
      setPinBuffer((prev) => prev + digit);
    }
  };

  const handleKeypadBackspace = () => {
    setPinBuffer((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setPinBuffer('');
  };

  // Calculate live preview text & timestamp
  const getCalculatedTime = () => {
    const now = new Date();

    if (notifyMode === 'relative') {
      const mins = customMinutes ? parseInt(customMinutes, 10) || relativeMinutes : relativeMinutes;
      const targetTime = new Date(now.getTime() + mins * 60000);
      const targetHours = targetTime.getHours();
      const targetMins = targetTime.getMinutes();
      const p = targetHours >= 12 ? '오후' : '오전';
      const h = targetHours % 12 || 12;
      const m = targetMins < 10 ? `0${targetMins}` : targetMins;

      return {
        timestamp: targetTime.getTime(),
        label: mins < 60 ? `${mins}분 뒤 (${p} ${h}:${m})` : `${Math.floor(mins / 60)}시간 뒤 (${p} ${h}:${m})`,
        preview: `오늘 ${p} ${h}:${m} 알림 예정 (${mins}분 뒤)`,
      };
    }

    if (notifyMode === 'calendar') {
      const target = new Date(selectedDate);
      let parsedHour = parseInt(hour, 10);
      if (ampm === '오후' && parsedHour < 12) parsedHour += 12;
      if (ampm === '오전' && parsedHour === 12) parsedHour = 0;
      target.setHours(parsedHour, parseInt(minute, 10), 0, 0);

      const y = target.getFullYear();
      const m = String(target.getMonth() + 1).padStart(2, '0');
      const d = String(target.getDate()).padStart(2, '0');
      const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
      const dayName = weekDays[target.getDay()];

      let datePrefix = `${y}.${m}.${d} (${dayName})`;
      if (activeDatePreset !== 'custom') {
        datePrefix = activeDatePreset;
      }

      return {
        timestamp: target.getTime(),
        label: `${datePrefix} ${ampm} ${hour}:${minute}`,
        preview: `${datePrefix} ${ampm} ${hour}:${minute} 알림 예정`,
      };
    }

    return {
      timestamp: undefined,
      label: '알림 없음',
      preview: '시간 설정 없이 단순 체크 메모로 저장됩니다',
    };
  };

  const calculated = getCalculatedTime();

  const handleFormSubmit = () => {
    if (!title.trim()) {
      onShowToast('기억 내용을 입력해주세요!');
      return;
    }

    if (activeTab === 'notification') {
      if (getNotificationPermissionState() !== 'granted') {
        requestNotificationPermission().then((res) => {
          if (res !== 'granted') {
            onShowToast('스마트폰 알림 권한을 허용해야 화면 밖에서도 알림이 울립니다!');
          }
        });
      }

      onSubmit({
        type: 'notification',
        title: title.trim(),
        desc: desc.trim() || undefined,
        notifyMode,
        notifyAt: calculated.timestamp,
        timeLabel: calculated.label,
        isCompleted: false,
      });
    } else {
      if (isPinEnabled) {
        if (!lockHint.trim()) {
          onShowToast('보안 메모의 설명(식별 이름)을 입력해주세요!');
          return;
        }
        if (pinBuffer.length !== 4) {
          onShowToast('보안 PIN 4자리를 모두 입력해주세요!');
          return;
        }
      }
      onSubmit({
        type: 'archive',
        title: title.trim(),
        desc: desc.trim() || undefined,
        category: selectedCategory === '없음' ? undefined : selectedCategory,
        isLocked: isPinEnabled,
        pin: isPinEnabled ? pinBuffer : undefined,
        secret: isPinEnabled ? title.trim() : undefined,
        lockHint: isPinEnabled ? lockHint.trim() : undefined,
        updatedAt: Date.now(),
        isCompleted: false,
      });
    }

    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 bg-white rounded-t-3xl shadow-2xl px-4 pt-3 pb-6 pb-safe max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
        {/* Drawer Handle & Header */}
        <div className="w-10 h-1 bg-[#dbdad6] rounded-full mx-auto mb-2 cursor-pointer" onClick={onClose} />
        
        <div className="flex items-center justify-between pb-2 border-b border-[#efeeea] mb-3">
          <div className="flex items-center gap-1.5">
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ color: activeTab === 'notification' ? '#f78f10' : '#6b5c44' }}
            >
              {activeTab === 'notification' ? 'add_task' : 'inventory_2'}
            </span>
            <span className="font-bold text-[16px] text-[#1b1c1a]">
              {activeTab === 'notification' ? '새 기억 등록하기' : '새 기억 보관하기'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[#efeeea] flex items-center justify-center text-[#887362] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFormSubmit();
          }}
          className="flex flex-col gap-3.5"
        >
          {/* 1. Main Title Input ("기억 입력") */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#1b1c1a]">
                기억 입력 <span className="text-[#887362] font-normal">(필수)</span>
              </label>
              <span className="text-[11px] text-[#887362]">여러 줄·문단 입력 가능</span>
            </div>
            <div className="relative w-full">
              <textarea
                rows={3}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  activeTab === 'notification'
                    ? '기억할 내용을 입력하세요 (예: B3층 주차 A-14, 세탁소 패딩 찾기...)'
                    : '보관할 내용을 입력하세요 (예: 집 와이파이 비번, 여권 위치...)'
                }
                className="w-full min-h-[92px] p-3 pl-10 rounded-xl bg-[#f5f4f0] text-sm text-[#1b1c1a] font-medium placeholder:text-[#887362]/70 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#f78f10] transition-all resize-y break-words whitespace-pre-wrap leading-relaxed"
                autoFocus
              />
              <span className="material-symbols-outlined absolute left-3 top-3 text-[18px] text-[#887362]">
                edit_note
              </span>
            </div>
          </div>

          {/* 2. Detailed Note (선택) */}
          <div>
            <label className="block text-xs font-bold text-[#1b1c1a] mb-1.5">
              상세 메모 <span className="font-normal text-[11px] text-[#887362]">(선택)</span>
            </label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="위치, 잊지 말아야 할 세부 사항이나 긴 메모를 자유롭게 적어두세요"
              className="w-full min-h-[76px] p-3 rounded-xl bg-[#f5f4f0] text-xs text-[#1b1c1a] placeholder:text-[#887362]/70 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#f78f10] transition-all resize-y break-words whitespace-pre-wrap leading-relaxed"
            />
          </div>

          {/* 3. Notification Specific Mode Switcher (PRD Requirement: 3분할 1줄 레이아웃 whitespace-nowrap) */}
          {activeTab === 'notification' ? (
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold text-[#1b1c1a]">알림 일시 설정 모드</div>

              {/* 3분할 1줄 레이아웃 (모바일 320px~에서도 쪼개지지 않도록 whitespace-nowrap 보장) */}
              <div className="flex items-center bg-[#f5f4f0] p-1 rounded-xl whitespace-nowrap gap-1">
                <button
                  type="button"
                  onClick={() => setNotifyMode('relative')}
                  className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold text-center transition-all ${
                    notifyMode === 'relative'
                      ? 'bg-[#f78f10] text-white shadow-xs'
                      : 'text-[#6b5c44] hover:text-[#1b1c1a]'
                  }`}
                >
                  n분/시간 뒤
                </button>
                <button
                  type="button"
                  onClick={() => setNotifyMode('calendar')}
                  className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold text-center transition-all ${
                    notifyMode === 'calendar'
                      ? 'bg-[#f78f10] text-white shadow-xs'
                      : 'text-[#6b5c44] hover:text-[#1b1c1a]'
                  }`}
                >
                  날짜·시간 (달력)
                </button>
                <button
                  type="button"
                  onClick={() => setNotifyMode('none')}
                  className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold text-center transition-all ${
                    notifyMode === 'none'
                      ? 'bg-[#f78f10] text-white shadow-xs'
                      : 'text-[#6b5c44] hover:text-[#1b1c1a]'
                  }`}
                >
                  알림 없음
                </button>
              </div>

              {/* Mode A: Relative Chips */}
              {notifyMode === 'relative' && (
                <div className="flex flex-col gap-1.5 p-2 bg-[#faf9f5] rounded-xl border border-[#e9e8e4]">
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    {[
                      { label: '10분 뒤', min: 10 },
                      { label: '30분 뒤', min: 30 },
                      { label: '1시간 뒤', min: 60 },
                      { label: '2시간 뒤', min: 120 },
                    ].map((chip) => (
                      <button
                        key={chip.min}
                        type="button"
                        onClick={() => {
                          setRelativeMinutes(chip.min);
                          setCustomMinutes('');
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs whitespace-nowrap transition-colors cursor-pointer ${
                          relativeMinutes === chip.min && !customMinutes
                            ? 'bg-[#f78f10] text-white font-bold shadow-xs'
                            : 'bg-white text-[#6b5c44] hover:bg-[#efeeea] border border-[#e9e8e4]'
                        }`}
                      >
                        {chip.label}
                      </button>
                    ))}

                    <div className="flex items-center gap-1 pl-1 shrink-0">
                      <input
                        type="number"
                        min="1"
                        max="999"
                        placeholder="직접"
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        className="w-14 h-7 text-center rounded-md bg-white border border-[#e9e8e4] text-xs font-medium text-[#1b1c1a] focus:outline-none focus:ring-1 focus:ring-[#f78f10]"
                      />
                      <span className="text-[11px] text-[#887362]">분</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mode B: Interactive 2026~2050 Calendar Date & Time Picker */}
              {notifyMode === 'calendar' && (
                <CalendarDatePicker
                  selectedDate={selectedDate}
                  onDateChange={(d, preset) => {
                    setSelectedDate(d);
                    if (preset) setActiveDatePreset(preset);
                  }}
                  activePreset={activeDatePreset}
                  ampm={ampm}
                  onAmpmChange={setAmpm}
                  hour={hour}
                  onHourChange={setHour}
                  minute={minute}
                  onMinuteChange={setMinute}
                />
              )}
            </div>
          ) : (
            /* Archive Specific Form: Category & PIN Lock */
            <div className="flex flex-col gap-3">
              {/* Category selector with '없음' & '추가' */}
              <div>
                <div className="text-xs font-bold text-[#1b1c1a] mb-1.5 flex items-center justify-between">
                  <span>카테고리 분류</span>
                  <span className="text-[10px] text-[#887362]/80">필수 또는 '없음' 선택</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
                  {/* '없음' 버튼 */}
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('없음')}
                    className={`h-8 px-3 rounded-lg text-xs transition-all shrink-0 cursor-pointer inline-flex items-center justify-center ${
                      selectedCategory === '없음'
                        ? 'bg-[#6b5c44] text-white font-bold shadow-xs'
                        : 'bg-[#f5f4f0] text-[#6b5c44] hover:bg-[#efeeea] font-medium'
                    }`}
                  >
                    없음
                  </button>

                  {/* '+ 추가' 버튼 ('없음' 바로 우측에 위치 & 크기 완벽 일치) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(!isAddingCategory);
                      setNewCategoryInput('');
                    }}
                    className={`h-8 px-3 rounded-lg text-xs border border-dashed transition-all shrink-0 inline-flex items-center justify-center gap-0.5 font-medium cursor-pointer ${
                      isAddingCategory
                        ? 'bg-[#f2ddbe]/50 border-[#6b5c44] text-[#1b1c1a] font-bold'
                        : 'border-[#dbc2ae] bg-[#f5f4f0]/60 text-[#6b5c44] hover:bg-[#efeeea] hover:border-[#6b5c44]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    추가
                  </button>

                  {/* 카테고리 목록 */}
                  {availableCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat);
                        if (cat === '계정/비번' && !isPinEnabled) {
                          setIsPinEnabled(true);
                        }
                      }}
                      className={`h-8 px-3 rounded-lg text-xs transition-all shrink-0 cursor-pointer inline-flex items-center justify-center ${
                        selectedCategory === cat
                          ? 'bg-[#6b5c44] text-white font-bold shadow-xs'
                          : 'bg-[#f5f4f0] text-[#6b5c44] hover:bg-[#efeeea] font-medium'
                      }`}
                    >
                      #{cat}
                    </button>
                  ))}
                </div>

                {/* 카테고리 추가 인라인 입력창 */}
                {isAddingCategory && (
                  <div className="flex items-center gap-1.5 mt-2 p-1.5 bg-[#faf9f5] rounded-xl border border-[#dbc2ae] animate-in fade-in duration-150">
                    <span className="text-xs text-[#887362] pl-1 font-bold">#</span>
                    <input
                      type="text"
                      value={newCategoryInput}
                      onChange={(e) => setNewCategoryInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddNewCategory();
                        } else if (e.key === 'Escape') {
                          setIsAddingCategory(false);
                          setNewCategoryInput('');
                        }
                      }}
                      placeholder="새 카테고리명 입력 후 Enter"
                      className="flex-1 bg-white px-2.5 py-1 rounded-lg text-xs text-[#1b1c1a] border border-[#e9e8e4] focus:outline-none focus:ring-1 focus:ring-[#6b5c44]"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleAddNewCategory}
                      className="px-2.5 py-1 rounded-lg bg-[#6b5c44] hover:bg-[#584c37] text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingCategory(false);
                        setNewCategoryInput('');
                      }}
                      className="px-2 py-1 rounded-lg text-xs text-[#887362] hover:bg-[#e9e8e4] transition-colors cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                )}
              </div>

              {/* PIN Protection Toggle Row */}
              <div
                onClick={() => {
                  const nextState = !isPinEnabled;
                  setIsPinEnabled(nextState);
                  if (nextState) {
                    setPinBuffer('');
                    setTimeout(() => {
                      pinInputRef.current?.focus();
                    }, 100);
                  }
                }}
                className="p-3 rounded-2xl bg-[#f5f4f0] border border-[#e9e8e4] flex items-center justify-between cursor-pointer hover:bg-[#efeeea] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isPinEnabled ? 'bg-[#6b5c44] text-white' : 'bg-[#e9e8e4] text-[#887362]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isPinEnabled ? 'lock' : 'lock_open'}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-[#1b1c1a]">
                      보안 메모로 설정 (4자리 PIN 잠금)
                    </span>
                    <span className="text-[11px] text-[#887362]">
                      {isPinEnabled ? '원하는 4자리 PIN 번호를 직접 입력하세요' : '터치하여 PIN 보호 활성화'}
                    </span>
                  </div>
                </div>

                <div
                  className={`w-11 h-6 rounded-full transition-colors flex items-center p-0.5 ${
                    isPinEnabled ? 'bg-[#6b5c44]' : 'bg-[#dbdad6]'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      isPinEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </div>
              </div>

              {/* Direct Custom PIN Setting (원하는 숫자로 직접 입력) */}
              {isPinEnabled && (
                <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
                  {/* 보안 메모 식별 설명 입력 창 (PIN 풀기 전 겉으로 표시될 설명) */}
                  <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#dbc2ae] flex flex-col gap-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[#1b1c1a] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#6b5c44]">badge</span>
                        <span>보안 메모 설명 (PIN 풀기 전 겉으로 표시될 이름)</span>
                      </label>
                      <span className="text-[10px] text-[#8e4f00] font-bold bg-[#fef0e3] px-1.5 py-0.2 rounded">
                        겉에 표시됨
                      </span>
                    </div>
                    <input
                      type="text"
                      value={lockHint}
                      onChange={(e) => setLockHint(e.target.value)}
                      placeholder="예: 아파트 현관 비밀번호, 은행 보안카드, 비상 금고"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#e9e8e4] text-xs text-[#1b1c1a] placeholder:text-[#887362]/60 focus:outline-none focus:ring-1 focus:ring-[#6b5c44] font-medium"
                    />
                    <p className="text-[10.5px] text-[#887362] leading-tight">
                      * 기억 내용(필수)과 상세 메모는 암호화되어 <strong>****</strong>로 숨겨지며, PIN 입력 전에는 오직 이 설명만 표시됩니다.
                    </p>
                  </div>

                  {/* 4자리 PIN 번호 설정 */}
                  <div className="p-3.5 rounded-2xl bg-[#faf9f5] border border-[#dbc2ae] flex flex-col gap-2.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#6b5c44]">pin</span>
                        <span className="text-xs font-bold text-[#1b1c1a]">4자리 PIN 번호 설정</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="px-2 py-0.5 rounded-md text-[11px] text-[#6b5c44] hover:bg-[#efeeea] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                          title={showPin ? '번호 숨기기' : '번호 보기'}
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {showPin ? 'visibility_off' : 'visibility'}
                          </span>
                          <span>{showPin ? '숨기기' : '번호보기'}</span>
                        </button>
                        {pinBuffer.length > 0 && (
                          <button
                            type="button"
                            onClick={handleKeypadClear}
                            className="px-2 py-0.5 rounded-md text-[11px] text-[#ba1a1a] hover:bg-[#ba1a1a]/10 font-medium transition-colors cursor-pointer"
                          >
                            전체 삭제
                          </button>
                        )}
                      </div>
                    </div>

                  {/* 4 Digit Display Boxes + Invisible Accessible Input */}
                  <div
                    onClick={() => pinInputRef.current?.focus()}
                    className="relative flex items-center justify-center gap-3 py-2 cursor-pointer select-none"
                  >
                    <input
                      ref={pinInputRef}
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={4}
                      value={pinBuffer}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                        setPinBuffer(val);
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full -z-0"
                    />

                    {[0, 1, 2, 3].map((idx) => {
                      const char = pinBuffer[idx];
                      const isCurrent = idx === pinBuffer.length;
                      return (
                        <div
                          key={idx}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-mono font-bold transition-all ${
                            char
                              ? 'bg-white border-2 border-[#6b5c44] text-[#1b1c1a] shadow-2xs'
                              : isCurrent
                              ? 'border-2 border-[#f78f10] bg-white ring-2 ring-[#f78f10]/20'
                              : 'border-2 border-[#e9e8e4] bg-[#f5f4f0] text-[#887362]/30'
                          }`}
                        >
                          {char ? (showPin ? char : '●') : ''}
                        </div>
                      );
                    })}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center justify-center text-center">
                    {pinBuffer.length === 4 ? (
                      <span className="text-[11px] text-[#2e7d32] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        4자리 PIN 설정 완료 ({showPin ? pinBuffer : '••••'})
                      </span>
                    ) : (
                      <span className="text-[11px] text-[#887362]">
                        아래 키패드를 터치하거나 직접 숫자를 입력하세요 ({pinBuffer.length}/4)
                      </span>
                    )}
                  </div>

                  {/* Interactive Numeric Keypad (4x3) */}
                  <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#efeeea]">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                      <button
                        key={digit}
                        type="button"
                        onClick={() => handleKeypadPress(digit)}
                        className="h-10 rounded-xl bg-white hover:bg-[#efeeea] border border-[#e9e8e4] text-[#1b1c1a] font-bold text-base flex items-center justify-center active:scale-95 transition-all shadow-2xs cursor-pointer"
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleKeypadClear}
                      className="h-10 rounded-xl bg-[#efeeea] hover:bg-[#e9e8e4] text-[#6b5c44] text-xs font-bold flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                    >
                      초기화
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeypadPress('0')}
                      className="h-10 rounded-xl bg-white hover:bg-[#efeeea] border border-[#e9e8e4] text-[#1b1c1a] font-bold text-base flex items-center justify-center active:scale-95 transition-all shadow-2xs cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="button"
                      onClick={handleKeypadBackspace}
                      className="h-10 rounded-xl bg-[#efeeea] hover:bg-[#e9e8e4] text-[#1b1c1a] flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                      title="한 글자 지우기"
                    >
                      <span className="material-symbols-outlined text-[18px]">backspace</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
          )}

          {/* Live Status Preview */}
          <div className="px-3 py-2 rounded-xl bg-[#f5f4f0] flex items-center justify-between text-xs border border-[#e9e8e4]">
            <div className="flex items-center gap-1.5 text-[#1b1c1a] truncate">
              <span
                className="material-symbols-outlined text-[16px] text-[#f78f10]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                notifications_active
              </span>
              <span className="truncate font-semibold">{calculated.preview}</span>
            </div>
            <span className="text-[10px] text-[#887362] shrink-0">실시간 반영</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="h-12 px-4 rounded-xl bg-[#efeeea] text-[#554335] font-semibold text-xs hover:bg-[#e9e8e4] transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              className={`flex-1 h-12 rounded-xl text-white font-bold text-sm shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'notification'
                  ? 'bg-[#f78f10] hover:bg-[#e07f08] shadow-[#f78f10]/30'
                  : 'bg-[#6b5c44] hover:bg-[#594d38] shadow-[#6b5c44]/30'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">
                {activeTab === 'notification' ? 'bookmark_added' : 'inventory_2'}
              </span>
              <span>{activeTab === 'notification' ? '기억 저장하기' : '기억 보관하기'}</span>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
