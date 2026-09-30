// Service Worker for Memory Pocket (기억주머니)
// Handles Background Alarms, System Push Notifications, and Vibration Feedback

const CACHE_NAME = 'memory-pocket-v1';
let scheduledAlarms = [];
let checkTimer = null;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Periodic check for due alarms in background
function startAlarmChecker() {
  if (checkTimer) clearInterval(checkTimer);
  checkTimer = setInterval(() => {
    checkDueAlarms();
  }, 10000); // Check every 10 seconds
}

function checkDueAlarms() {
  const now = Date.now();
  const remaining = [];

  scheduledAlarms.forEach((alarm) => {
    if (alarm.notifyAt && alarm.notifyAt <= now) {
      showAlarmNotification(alarm);
    } else {
      remaining.push(alarm);
    }
  });

  scheduledAlarms = remaining;
}

// Display System Interface Notification with Mobile Vibration and Memo Content
function showAlarmNotification(alarm) {
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
    // Vibration pattern: [vibrate, pause, vibrate, pause, vibrate] in milliseconds
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
    actions: [
      { action: 'open', title: '메모 열기' },
      { action: 'dismiss', title: '닫기' }
    ]
  };

  self.registration.showNotification(title, options).catch((err) => {
    console.error('Failed to show notification in SW:', err);
  });
}

// Message listener from React client
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SCHEDULE_ALARMS') {
    scheduledAlarms = event.data.alarms || [];
    startAlarmChecker();
  } else if (event.data.type === 'TEST_NOTIFICATION') {
    self.registration.showNotification('🔔 [기억주머니] 알림 및 진동 테스트', {
      body: '스마트폰 화면 알림과 진동이 정상적으로 작동하고 있습니다!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [300, 150, 300, 150, 450],
      tag: 'memory-pocket-test',
      renotify: true,
      requireInteraction: true,
      data: { url: '/' }
    }).catch((err) => {
      console.error('Failed to show test notification:', err);
    });
  } else if (event.data.type === 'DISMISS_ALARM') {
    scheduledAlarms = scheduledAlarms.filter((a) => a.id !== event.data.id);
  }
});

// Handle clicking on the system notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus the app window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            id: event.notification.data?.id,
            openAlarmModal: true,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/?openAlarm=' + encodeURIComponent(event.notification.data?.id || ''));
      }
    })
  );
});
