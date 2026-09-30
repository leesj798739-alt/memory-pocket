import React, { useState, useMemo } from 'react';

interface CalendarDatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date, preset?: '오늘' | '내일' | '모레' | '1주 뒤' | 'custom') => void;
  activePreset: '오늘' | '내일' | '모레' | '1주 뒤' | 'custom';
  ampm: '오전' | '오후';
  onAmpmChange: (val: '오전' | '오후') => void;
  hour: string;
  onHourChange: (val: string) => void;
  minute: string;
  onMinuteChange: (val: string) => void;
}

const MIN_YEAR = 2026;
const MAX_YEAR = 2050;

export const CalendarDatePicker: React.FC<CalendarDatePickerProps> = ({
  selectedDate,
  onDateChange,
  activePreset,
  ampm,
  onAmpmChange,
  hour,
  onHourChange,
  minute,
  onMinuteChange,
}) => {
  // Calendar viewing year and month (1-indexed for month: 1 ~ 12)
  const [viewYear, setViewYear] = useState<number>(() => {
    const y = selectedDate.getFullYear();
    return Math.min(Math.max(y, MIN_YEAR), MAX_YEAR);
  });
  const [viewMonth, setViewMonth] = useState<number>(() => selectedDate.getMonth() + 1);

  // Toggle state to show/collapse the calendar grid under '날짜 선택'
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(activePreset === 'custom');

  // Days of week in Korean
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

  // Calculate days for viewYear & viewMonth
  const { daysInMonth, firstDayOfWeek, prevMonthDays } = useMemo(() => {
    const dim = new Date(viewYear, viewMonth, 0).getDate();
    const fd = new Date(viewYear, viewMonth - 1, 1).getDay();
    const pmd = new Date(viewYear, viewMonth - 1, 0).getDate();
    return { daysInMonth: dim, firstDayOfWeek: fd, prevMonthDays: pmd };
  }, [viewYear, viewMonth]);

  // Navigate month
  const handlePrevMonth = () => {
    if (viewYear === MIN_YEAR && viewMonth === 1) return;
    if (viewMonth === 1) {
      setViewYear((prev) => prev - 1);
      setViewMonth(12);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewYear === MAX_YEAR && viewMonth === 12) return;
    if (viewMonth === 12) {
      setViewYear((prev) => prev + 1);
      setViewMonth(1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Quick preset click handler
  const handlePresetClick = (preset: '오늘' | '내일' | '모레' | '1주 뒤') => {
    const target = new Date();
    if (preset === '내일') target.setDate(target.getDate() + 1);
    if (preset === '모레') target.setDate(target.getDate() + 2);
    if (preset === '1주 뒤') target.setDate(target.getDate() + 7);

    setViewYear(Math.min(Math.max(target.getFullYear(), MIN_YEAR), MAX_YEAR));
    setViewMonth(target.getMonth() + 1);
    onDateChange(target, preset);
  };

  // Date cell click in calendar
  const handleDaySelect = (day: number) => {
    const newDate = new Date(viewYear, viewMonth - 1, day);
    onDateChange(newDate, 'custom');
  };

  const handleCustomToggle = () => {
    if (!isCalendarOpen) {
      setIsCalendarOpen(true);
      onDateChange(selectedDate, 'custom');
    } else {
      if (activePreset === 'custom') {
        setIsCalendarOpen(false);
      } else {
        onDateChange(selectedDate, 'custom');
      }
    }
  };

  const isCustomActive =
    activePreset === 'custom' ||
    (isCalendarOpen &&
      activePreset !== '오늘' &&
      activePreset !== '내일' &&
      activePreset !== '모레' &&
      activePreset !== '1주 뒤');

  const today = new Date();

  // Selected date formatted preview string
  const formattedSelectedDate = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    const dayName = weekDays[selectedDate.getDay()];
    return `${y}.${m}.${d} (${dayName})`;
  }, [selectedDate]);

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-[#faf9f5] rounded-2xl border border-[#e9e8e4]">
      {/* Top Title & Selected Display */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-[#1b1c1a] flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px] text-[#f78f10]">
            calendar_month
          </span>
          날짜·시간 선택
        </span>
        <span className="text-xs text-[#8e4f00] font-bold">
          {formattedSelectedDate} {ampm} {hour}:{minute}
        </span>
      </div>

      {/* Quick Date Presets + '날짜 선택' Button (동일한 디자인과 크기) */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {(['오늘', '내일', '모레', '1주 뒤'] as const).map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handlePresetClick(preset)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activePreset === preset
                ? 'bg-[#f78f10] text-white shadow-xs'
                : 'bg-white text-[#6b5c44] hover:bg-[#efeeea] border border-[#e9e8e4]'
            }`}
          >
            {preset}
          </button>
        ))}

        {/* '날짜 선택' button (오늘, 내일 등과 100% 동일한 디자인과 크기) */}
        <button
          type="button"
          onClick={handleCustomToggle}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isCustomActive
              ? 'bg-[#f78f10] text-white shadow-xs'
              : 'bg-white text-[#6b5c44] hover:bg-[#efeeea] border border-[#e9e8e4]'
          }`}
          title="2026~2050년 달력에서 날짜 직접 선택"
        >
          날짜 선택
        </button>
      </div>

      {/* Collapsible/Expandable 2026~2050 Accurate Calendar Grid */}
      {isCalendarOpen && (
        <div className="bg-white p-3 rounded-xl border border-[#e9e8e4] shadow-xs flex flex-col gap-2 mt-0.5 animate-in fade-in duration-200">
          {/* Calendar Header with Year & Month Selection (2026 ~ 2050) */}
          <div className="flex items-center justify-between pb-1.5 border-b border-[#efeeea]">
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={viewYear === MIN_YEAR && viewMonth === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#efeeea] text-[#554335] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="이전 달"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            {/* Year & Month Selectors */}
            <div className="flex items-center gap-1.5">
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-[#1b1c1a] bg-[#f5f4f0] hover:bg-[#efeeea] px-2 py-1 rounded-md border border-[#dbc2ae]/60 focus:outline-none focus:border-[#f78f10] cursor-pointer"
              >
                {Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MIN_YEAR + i).map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
              </select>

              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="text-xs font-bold text-[#1b1c1a] bg-[#f5f4f0] hover:bg-[#efeeea] px-2 py-1 rounded-md border border-[#dbc2ae]/60 focus:outline-none focus:border-[#f78f10] cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {m}월
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              disabled={viewYear === MAX_YEAR && viewMonth === 12}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#efeeea] text-[#554335] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="다음 달"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold py-1">
            <span className="text-[#ba1a1a]">일</span>
            <span className="text-[#554335]">월</span>
            <span className="text-[#554335]">화</span>
            <span className="text-[#554335]">수</span>
            <span className="text-[#554335]">목</span>
            <span className="text-[#554335]">금</span>
            <span className="text-[#2563eb]">토</span>
          </div>

          {/* Calendar Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
            {/* Trailing days from previous month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => {
              const prevDate = prevMonthDays - firstDayOfWeek + i + 1;
              return (
                <div
                  key={`prev-${i}`}
                  className="py-1.5 text-[#dbc2ae] text-[11px] select-none"
                >
                  {prevDate}
                </div>
              );
            })}

            {/* Current month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected =
                selectedDate.getFullYear() === viewYear &&
                selectedDate.getMonth() === viewMonth - 1 &&
                selectedDate.getDate() === day;

              const isCurrentDay =
                today.getFullYear() === viewYear &&
                today.getMonth() === viewMonth - 1 &&
                today.getDate() === day;

              const dayOfWeek = (firstDayOfWeek + i) % 7;
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDaySelect(day)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer relative flex items-center justify-center ${
                    isSelected
                      ? 'bg-[#f78f10] text-white font-bold shadow-xs scale-105 z-10'
                      : isCurrentDay
                      ? 'bg-[#f2ddbe]/80 text-[#8e4f00] font-bold border border-[#f78f10]/40'
                      : 'hover:bg-[#f5f4f0] text-[#1b1c1a]'
                  } ${
                    !isSelected && isSunday
                      ? 'text-[#ba1a1a]'
                      : !isSelected && isSaturday
                      ? 'text-[#2563eb]'
                      : ''
                  }`}
                >
                  <span>{day}</span>
                  {isCurrentDay && !isSelected && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#f78f10]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer inside calendar: chosen date label and today jump */}
          <div className="flex items-center justify-between pt-1 border-t border-[#efeeea] text-[11px]">
            <span className="text-[#887362]">
              선택: <strong className="text-[#8e4f00]">{formattedSelectedDate}</strong>
            </span>
            <button
              type="button"
              onClick={() => handlePresetClick('오늘')}
              className="text-[#f78f10] font-bold hover:underline cursor-pointer"
            >
              오늘로 이동
            </button>
          </div>
        </div>
      )}

      {/* Time Pickers Row (PRD Requirement: 오전/오후 + 시 + 분 그대로 유지) */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#efeeea]">
        <span className="text-xs font-semibold text-[#1b1c1a] flex items-center gap-1 shrink-0">
          <span className="material-symbols-outlined text-[15px] text-[#887362]">schedule</span>
          시간:
        </span>
        <div className="flex-1 grid grid-cols-3 gap-1.5">
          <select
            value={ampm}
            onChange={(e) => onAmpmChange(e.target.value as '오전' | '오후')}
            className="text-xs font-medium bg-white rounded-lg border border-[#dbc2ae]/60 py-1.5 px-2 text-[#1b1c1a] focus:outline-none focus:border-[#f78f10] cursor-pointer"
          >
            <option value="오전">오전</option>
            <option value="오후">오후</option>
          </select>

          <select
            value={hour}
            onChange={(e) => onHourChange(e.target.value)}
            className="text-xs font-medium bg-white rounded-lg border border-[#dbc2ae]/60 py-1.5 px-2 text-[#1b1c1a] focus:outline-none focus:border-[#f78f10] cursor-pointer"
          >
            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((h) => (
              <option key={h} value={h}>
                {h}시
              </option>
            ))}
          </select>

          <select
            value={minute}
            onChange={(e) => onMinuteChange(e.target.value)}
            className="text-xs font-medium bg-white rounded-lg border border-[#dbc2ae]/60 py-1.5 px-2 text-[#1b1c1a] focus:outline-none focus:border-[#f78f10] cursor-pointer"
          >
            {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
              <option key={m} value={m}>
                {m}분
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
