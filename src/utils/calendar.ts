/**
 * Utilities for exporting memory notifications to Smartphone Native Calendar/Alarm (.ics)
 */

export function exportToPhoneCalendar(item: {
  title: string;
  desc?: string;
  notifyAt?: number;
  tags?: string[];
}): boolean {
  if (!item.notifyAt) return false;

  try {
    const startDate = new Date(item.notifyAt);
    const endDate = new Date(item.notifyAt + 30 * 60 * 1000); // 30 minutes duration

    const formatICSDate = (d: Date) => {
      return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    const startStr = formatICSDate(startDate);
    const endStr = formatICSDate(endDate);
    const nowStr = formatICSDate(new Date());

    const summary = `[기억주머니] ${item.title.replace(/[\r\n]+/g, ' ')}`;
    const tagText = item.tags && item.tags.length > 0 ? `\\n태그: ${item.tags.map((t) => '#' + t).join(' ')}` : '';
    const descText = item.desc ? item.desc.replace(/[\r\n]+/g, '\\n') : '기억주머니에서 등록된 알림 메모입니다.';
    const fullDesc = `${descText}${tagText}\\n\\n(기억주머니 Memory Pocket)`;

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
    return true;
  } catch (err) {
    console.error('Error generating calendar event:', err);
    return false;
  }
}
