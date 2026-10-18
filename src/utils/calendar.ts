import { Capacitor, registerPlugin } from '@capacitor/core';

const phoneCalendar = registerPlugin<{
  openEvent(options: { title: string; description: string; start: number }): Promise<void>;
}>('PhoneCalendar');

export async function exportToPhoneCalendar(item: {
  title: string;
  desc?: string;
  notifyAt?: number;
  tags?: string[];
}): Promise<'opened' | 'downloaded' | 'missing-time' | 'error'> {
  if (!item.notifyAt || !Number.isFinite(item.notifyAt)) return 'missing-time';

  try {
    if (Capacitor.getPlatform() === 'android') {
      await phoneCalendar.openEvent({
        title: item.title,
        description: item.desc || '',
        start: item.notifyAt,
      });
      return 'opened';
    }

    const startDate = new Date(item.notifyAt);
    const endDate = new Date(item.notifyAt + 30 * 60 * 1000); // 30 minutes duration

    const formatICSDate = (d: Date) => {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startStr = formatICSDate(startDate);
    const endStr = formatICSDate(endDate);
    const nowStr = formatICSDate(new Date());

    const escapeICS = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
    const summary = `[기억주머니] ${escapeICS(item.title)}`;
    const descText = item.desc ? escapeICS(item.desc) : '기억주머니에서 등록된 알림 메모입니다.';
    const fullDesc = `${descText}\\n\\n(기억주머니 Memory Pocket)`;

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//MemoryPocket//KO',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:memory-pocket-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@memorypocket.app`,
      `DTSTAMP:${nowStr}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${fullDesc}`,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'TRIGGER:-PT0M', // Ring exact on time
      'ACTION:DISPLAY',
      `DESCRIPTION:${summary}`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = item.title.replace(/[^a-zA-Z0-9가-힣_-]/g, '_').slice(0, 20) || '기억알람';
    link.setAttribute('download', `${cleanTitle}_알람.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return 'downloaded';
  } catch (err) {
    console.error('Error generating calendar event:', err);
    return 'error';
  }
}

export function calendarResultMessage(result: Awaited<ReturnType<typeof exportToPhoneCalendar>>): string {
  switch (result) {
    case 'opened': return '캘린더에서 알림을 확인하고 저장해 주세요 📅';
    case 'downloaded': return '일정 파일을 내려받았습니다. 캘린더에서 열어 저장해 주세요 📅';
    case 'missing-time': return '먼저 알림 날짜와 시간을 설정해 주세요.';
    case 'error': return '캘린더를 열 수 없습니다. 캘린더 앱을 확인해 주세요.';
  }
}
