import { MemoryItem } from '../types';
import { sound } from './sound';

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export type ExtendedNotificationOptions = NotificationOptions & {
  vibrate?: number[];
  renotify?: boolean;
  requireInteraction?: boolean;
};

let swRegistration: ServiceWorkerRegistration | null = null;
let backgroundWorker: Worker | null = null;
let lastSyncedAlarms: MemoryItem[] = [];

const DB_NAME = 'MemoryPocketDB';
const DB_VERSION = 1;
const STORE_NAME = 'scheduled_alarms';

// Open IndexedDB matching the Service Worker
function openAlarmDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Persist alarms to IndexedDB for SW retrieval
async function persistAlarmsToDB(alarms: any[]): Promise<void> {
  try {
    const db = await openAlarmDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    alarms.forEach((a) => store.put(a));
    await new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.warn('Failed to persist alarms to IndexedDB:', e);
  }
}

/**
 * Check if the app is currently running in standalone PWA mode (added to home screen)
 */
export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/**
 * Check if the user is on an iOS device (iPhone / iPad)
 */
export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(ua);
}

/**
 * Check if the user is on an Android device
 */
export function isAndroidDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  return /android/.test(ua);
}

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

    // Try registering periodic background sync if supported (Android Chromium PWA)
    if ('periodicSync' in reg) {
      try {
        const periodicSync = (reg as any).periodicSync;
        await periodicSync.register('check-memory-alarms', {
          minInterval: 60 * 1000, // 1 minute
        });
      } catch {}
    }

    // Listen for messages from SW (e.g. notification click)
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'NOTIFICATION_CLICKED') {
        const id = event.data.id;
        const openAlarmModal = !!event.data.openAlarmModal;
        window.dispatchEvent(new CustomEvent('MEMORY_NOTIFICATION_CLICK', { detail: { id, openAlarmModal } }));
      }
    });

    // Start dedicated off-main-thread Web Worker for persistent background ticking
    startBackgroundWorker();

    return reg;
  } catch (err) {
    console.warn('Service worker registration failed:', err);
    return null;
  }
}

/**
 * Dedicated Web Worker timer that is immune to window DOM throttling when tab is backgrounded
 */
function startBackgroundWorker(): void {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') return;
  if (backgroundWorker) return;

  try {
    const workerScript = `
      let timer = null;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          if (timer) clearInterval(timer);
          timer = setInterval(function() {
            self.postMessage('TICK');
          }, 2000);
        } else if (e.data === 'stop') {
          if (timer) clearInterval(timer);
          timer = null;
        }
      };
    `;
    const blob = new Blob([workerScript], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    backgroundWorker = new Worker(workerUrl);

    backgroundWorker.onmessage = () => {
      // Check due alarms on every tick
      checkClientDueAlarms();
    };

    backgroundWorker.postMessage('start');
  } catch (e) {
    console.warn('Could not initialize background web worker:', e);
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
 * Send scheduled active alarms to Service Worker and IndexedDB for background checking
 */
export async function syncAlarmsToServiceWorker(alarms: MemoryItem[]): Promise<void> {
  lastSyncedAlarms = alarms;

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

  // 1. Persist directly to shared IndexedDB so SW can read even when woke up by OS
  await persistAlarmsToDB(activeReminders);

  // 2. Post to active Service Worker controller
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
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
}

// Client-side due alarms verification
function checkClientDueAlarms(): void {
  if (!lastSyncedAlarms || lastSyncedAlarms.length === 0) return;
  const now = Date.now();

  const due = lastSyncedAlarms.filter(
    (m) => m.type === 'notification' && !m.isCompleted && !m.isDeleted && m.notifyAt && m.notifyAt <= now
  );

  if (due.length > 0) {
    // Notify window
    due.forEach((item) => {
      window.dispatchEvent(new CustomEvent('MEMORY_DUE_ALARM', { detail: { item } }));
    });
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

  const options: ExtendedNotificationOptions = {
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
 * Schedule a 10-second test alarm to verify background delivery when leaving the app
 */
export async function schedule10SecBackgroundTest(): Promise<{ success: boolean; message: string }> {
  const perm = getNotificationPermissionState();

  if (perm === 'unsupported') {
    return {
      success: false,
      message: '현재 브라우저에서는 시스템 알림 API를 지원하지 않습니다.',
    };
  }

  if (perm !== 'granted') {
    const nextPerm = await requestNotificationPermission();
    if (nextPerm !== 'granted') {
      return {
        success: false,
        message: '알림 권한을 먼저 [허용]해 주셔야 백그라운드 알림을 받을 수 있습니다.',
      };
    }
  }

  const testAlarm: MemoryItem = {
    id: `test-${Date.now()}`,
    type: 'notification',
    title: '📱 앱 나가기 테스트 알림 성공!',
    desc: '앱을 나가도 스마트폰 상단 알림과 진동이 성공적으로 울립니다 📳',
    tags: ['테스트', '백그라운드'],
    timeLabel: '방금',
    createdAt: Date.now(),
    notifyAt: Date.now() + 10000, // exactly 10 seconds later
    isCompleted: false,
    isDeleted: false,
  };

  // Sync to Service Worker and IndexedDB
  await syncAlarmsToServiceWorker([...lastSyncedAlarms, testAlarm]);

  // Also post directly to SW
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    if (reg.active) {
      reg.active.postMessage({
        type: 'TEST_BACKGROUND_ALARM',
        alarm: {
          id: testAlarm.id,
          title: testAlarm.title,
          desc: testAlarm.desc,
          notifyAt: testAlarm.notifyAt,
          timeLabel: testAlarm.timeLabel,
          tags: testAlarm.tags,
        },
      });
    }
  }

  return {
    success: true,
    message: '10초 후 테스트 알림이 예약되었습니다! 지금 바로 스마트폰 홈 화면으로 나가보세요.',
  };
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
  const options: ExtendedNotificationOptions = {
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
