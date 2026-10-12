import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { MemoryItem } from '../types';

let nativeListenerReady = false;

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

// Capacitor 알림 ID는 숫자여야 하므로
// 기존 memo 문자열 ID를 안정적인 숫자로 변환
function toNotificationId(value: string): number {
  let hash = 0;

  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }

  const positive = Math.abs(hash) || 1;

  return positive % 2147483647;
}

export async function requestNativeNotificationPermission(): Promise<boolean> {
  if (!isNativeApp()) return false;

  try {
    let permission = await LocalNotifications.checkPermissions();

    if (permission.display !== 'granted') {
      permission = await LocalNotifications.requestPermissions();
    }

    return permission.display === 'granted';
  } catch (error) {
    console.error('Native notification permission error:', error);
    return false;
  }
}

export async function initNativeNotifications(): Promise<void> {
  if (!isNativeApp() || nativeListenerReady) return;

  nativeListenerReady = true;

  await LocalNotifications.addListener(
    'localNotificationActionPerformed',
    (action) => {
      const memoryId = action.notification.extra?.memoryId;

      if (typeof memoryId === 'string') {
        window.dispatchEvent(
          new CustomEvent('MEMORY_NOTIFICATION_CLICK', {
            detail: {
              id: memoryId,
              openAlarmModal: true,
            },
          })
        );
      }
    }
  );
}

export async function syncNativeNotifications(
  alarms: MemoryItem[]
): Promise<void> {
  if (!isNativeApp()) return;

  try {
    await initNativeNotifications();

    const allowed = await requestNativeNotificationPermission();

    if (!allowed) {
      console.warn('Notification permission not granted');
      return;
    }

    // 기존 예약 알림을 모두 취소하고
    // 현재 활성화된 알림 메모 기준으로 다시 예약
    await LocalNotifications.cancelAll();

    const activeReminders = alarms.filter(
      (m) =>
        m.type === 'notification' &&
        !m.isCompleted &&
        !m.isDeleted &&
        m.notifyAt &&
        m.notifyAt > Date.now()
    );

    if (activeReminders.length === 0) return;

    const result = await LocalNotifications.schedule({
      notifications: activeReminders.map((memo) => ({
        id: toNotificationId(memo.id),

        title: `🔔 기억주머니 - ${memo.title}`,

        body:
          memo.desc ||
          '기억할 시간이에요. 메모 내용을 확인해보세요.',

        schedule: {
          at: new Date(memo.notifyAt!),
          allowWhileIdle: true,
        },

        // Android에서 가능한 경우 정확한 시간 알림 사용
        isExactNotification: true,
        isExactMandatory: false,

        foreground: true,

        extra: {
          memoryId: memo.id,
        },
      })),
    });

    if (result.warning) {
      console.warn('Local notification warning:', result.warning);
    }
  } catch (error) {
    console.error('Failed to sync native notifications:', error);
  }
}

export async function showNativeNotificationNow(
  memo: MemoryItem
): Promise<boolean> {
  if (!isNativeApp()) return false;

  try {
    const allowed = await requestNativeNotificationPermission();

    if (!allowed) return false;

    await LocalNotifications.schedule({
      notifications: [
        {
          id: toNotificationId(`instant_${memo.id}_${Date.now()}`),

          title: `🔔 기억주머니 - ${memo.title}`,

          body:
            memo.desc ||
            '기억할 시간이에요. 메모 내용을 확인해보세요.',

          foreground: true,

          extra: {
            memoryId: memo.id,
          },
        },
      ],
    });

    return true;
  } catch (error) {
    console.error('Immediate native notification failed:', error);
    return false;
  }
}