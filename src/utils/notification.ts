import { MemoryItem } from '../types';
import { sound } from './sound';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register Service Worker for background alarm push & system notifications
 */
export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    swRegistration = reg;

    // Listen for messages from SW (e.g. notification click)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICKED') {
        const id = event.data.id;
        const openAlarmModal = !!event.data.openAlarmModal;
        window.dispatchEvent(new CustomEvent('MEMORY_NOTIFICATION_CLICK', { detail: { id, openAlarmModal } }));
      }
    });

    return reg;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Get current notification permission state
 */
export function getNotificationPermissionState(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission as NotificationPermissionState;
}

/**
 * Request notification permission from user and trigger vibration confirmation
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }

  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      // Trigger a light tactile vibration feedback
      triggerVibration([150, 80, 150]);
      sound.playAlarmChime();
    }
    return result as NotificationPermissionState;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
}

/**
 * Trigger mobile device physical vibration
 */
export function triggerVibration(pattern: number[] = [300, 150, 300, 150, 450]): boolean {
  if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
    try {
      return navigator.vibrate(pattern);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Send scheduled active alarms to Service Worker for background checking
 */
export function syncAlarmsToServiceWorker(alarms: MemoryItem[]): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  const activeReminders = alarms
    .filter((m) => m.type === 'notification' && !m.isCompleted && !m.isDeleted && m.notifyAt && m.notifyAt > Date.now())
    .map((m) => ({
      id: m.id,
      title: m.title,
      desc: m.desc,
      notifyAt: m.notifyAt,
      timeLabel: m.timeLabel,
      tags: m.tags,
    }));

  const post = (controller: ServiceWorker) => {
    controller.postMessage({
      type: 'SCHEDULE_ALARMS',
      alarms: activeReminders,
    });
  };

  if (navigator.serviceWorker.controller) {
    post(navigator.serviceWorker.controller);
  } else {
    navigator.serviceWorker.ready.then((reg) => {
      swRegistration = reg;
      if (reg.active) {
        post(reg.active);
      }
    }).catch(() => {});
  }
}

/**
 * Trigger immediate phone interface notification with vibration
 */
export async function triggerPhoneNotification(alarm: MemoryItem): Promise<boolean> {
  // 1. Play sound
  sound.playAlarmChime();

  // 2. Hardware vibration: 3 vibration pulses
  triggerVibration([300, 150, 300, 150, 450]);

  // 3. System Notification on phone interface
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const title = `🔔 [기억할 시간] ${alarm.title}`;
  const tagList = alarm.tags && alarm.tags.length > 0 ? `\n🏷️ ${alarm.tags.map((t) => '#' + t).join(' ')}` : '';
  const timeInfo = alarm.timeLabel ? ` (${alarm.timeLabel})` : '';
  const bodyText = alarm.desc
    ? `${alarm.desc}${tagList}${timeInfo}`
    : `기억할 시간이에요! 터치하여 메모 내용을 바로 확인하세요.${tagList}${timeInfo}`;

  const options = {
    body: bodyText,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [300, 150, 300, 150, 450],
    tag: `memory-alarm-${alarm.id}`,
    renotify: true,
    requireInteraction: true,
    data: {
      id: alarm.id,
      url: '/',
      title: alarm.title,
      desc: alarm.desc,
      tags: alarm.tags,
      timeLabel: alarm.timeLabel,
    },
  };

  // Try Service Worker registration first (standard on mobile)
  if ('serviceWorker' in navigator) {
    try {
      const reg = swRegistration || (await navigator.serviceWorker.ready);
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, options);
        return true;
      }
    } catch (e) {
      console.warn('SW notification fallback:', e);
    }
  }

  // Desktop / standard notification fallback
  try {
    new Notification(title, options);
    return true;
  } catch (e) {
    console.warn('Standard notification failed:', e);
    return false;
  }
}

/**
 * Run a full notification + vibration test
 */
export async function testPhoneAlarmAndVibration(): Promise<{ success: boolean; message: string }> {
  const perm = getNotificationPermissionState();

  if (perm === 'unsupported') {
    return {
      success: false,
      message: '현재 브라우저 환경에서는 시스템 알림 API를 지원하지 않습니다.',
    };
  }

  if (perm !== 'granted') {
    const nextPerm = await requestNotificationPermission();
    if (nextPerm !== 'granted') {
      return {
        success: false,
        message: '브라우저 알림 권한이 허용되지 않았습니다. 사이트 설정에서 알림을 허용해주세요.',
      };
    }
  }

  // Play test sound
  sound.playAlarmChime();

  // Hardware vibration test
  triggerVibration([300, 150, 300, 150, 450]);

  // Trigger test system notification via SW or standard
  const title = '🔔 [기억주머니] 알림 및 진동 테스트';
  const options = {
    body: '스마트폰 화면 알림과 진동이 정상적으로 작동하고 있습니다! 📳',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [300, 150, 300, 150, 450],
    tag: 'memory-pocket-test',
    renotify: true,
    requireInteraction: true,
  };

  if ('serviceWorker' in navigator) {
    try {
      const reg = swRegistration || (await navigator.serviceWorker.ready);
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, options);
        return {
          success: true,
          message: '화면 알림과 진동이 성공적으로 울렸습니다! 📳',
        };
      }
    } catch {}
  }

  try {
    new Notification(title, options);
    return {
      success: true,
      message: '화면 알림과 진동이 성공적으로 울렸습니다! 📳',
    };
  } catch (err) {
    return {
      success: false,
      message: '알림 전송 중 오류가 발생했습니다: ' + String(err),
    };
  }
}
