// Service Worker for Memory Pocket (기억주머니)
// Handles Persistent Alarms, System Push/Scheduled Notifications, and Vibration Feedback

const DB_NAME = 'MemoryPocketDB';
const DB_VERSION = 1;
const STORE_NAME = 'scheduled_alarms';

let checkIntervalId = null;
let nearestTimeoutId = null;

// IndexedDB Helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveAlarmsToDB(alarms) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    alarms.forEach((alarm) => {
      store.put(alarm);
    });
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.error('SW: Error saving to IndexedDB:', err);
    return false;
  }
}

async function getAlarmsFromDB() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

async function removeAlarmFromDB(id) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
  } catch {}
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      checkDueAlarms(),
      scheduleNearestAlarm()
    ])
  );
  startPeriodicChecker();
});

// Periodic in-worker checker
function startPeriodicChecker() {
  if (checkIntervalId) clearInterval(checkIntervalId);
  checkIntervalId = setInterval(() => {
    checkDueAlarms();
  }, 5000);
}

// Check and trigger any alarms that have matured
async function checkDueAlarms() {
  const alarms = await getAlarmsFromDB();
  const now = Date.now();

  for (const alarm of alarms) {
    if (alarm.notifyAt && alarm.notifyAt <= now) {
      await showAlarmNotification(alarm);
      await removeAlarmFromDB(alarm.id);
    }
  }

  await scheduleNearestAlarm();
}

// Calculate the nearest alarm and set a targeted timeout
async function scheduleNearestAlarm() {
  if (nearestTimeoutId) clearTimeout(nearestTimeoutId);

  const alarms = await getAlarmsFromDB();
  const now = Date.now();
  const upcoming = alarms
    .filter((a) => a.notifyAt && a.notifyAt > now)
    .sort((a, b) => (a.notifyAt || 0) - (b.notifyAt || 0));

  if (upcoming.length === 0) return;

  const nearest = upcoming[0];
  const delay = Math.max(0, nearest.notifyAt - now);

  // If TimestampTrigger (Scheduled Notification API) is supported by browser, register it
  try {
    if ('showTrigger' in Notification.prototype && typeof TimestampTrigger !== 'undefined') {
      const title = `🔔 [기억할 시간] ${nearest.title}`;
      const timeInfo = nearest.timeLabel ? ` (${nearest.timeLabel})` : '';
      const bodyText = nearest.desc
        ? `${nearest.desc}${timeInfo}`
        : `기억할 시간이에요! 터치하여 메모 내용을 바로 확인하세요.${timeInfo}`;

      await self.registration.showNotification(title, {
        body: bodyText,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [300, 150, 300, 150, 450],
        tag: `memory-alarm-${nearest.id}`,
        renotify: true,
        requireInteraction: true,
        showTrigger: new TimestampTrigger(nearest.notifyAt),
        data: {
          id: nearest.id,
          url: '/',
          title: nearest.title,
        },
      });
    }
  } catch (err) {
    console.log('TimestampTrigger not available or failed:', err);
  }

  // Also set a local timeout
  if (delay < 24 * 60 * 60 * 1000) {
    nearestTimeoutId = setTimeout(() => {
      checkDueAlarms();
    }, delay);
  }
}

// Show native system interface notification with vibration
async function showAlarmNotification(alarm) {
  const title = `🔔 [기억할 시간] ${alarm.title}`;
  const timeInfo = alarm.timeLabel ? ` (${alarm.timeLabel})` : '';
  const bodyText = alarm.desc
    ? `${alarm.desc}${timeInfo}`
    : `기억할 시간이에요! 터치하여 메모 내용을 바로 확인하세요.${timeInfo}`;

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
    actions: [
      { action: 'open', title: '메모 확인' },
      { action: 'dismiss', title: '닫기' },
    ],
  };

  try {
    await self.registration.showNotification(title, options);
  } catch (err) {
    console.error('SW showNotification error:', err);
  }
}

// Message handler from web client
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SCHEDULE_ALARMS') {
    const alarms = event.data.alarms || [];
    event.waitUntil(
      saveAlarmsToDB(alarms).then(() => {
        scheduleNearestAlarm();
        startPeriodicChecker();
      })
    );
  } else if (event.data.type === 'TEST_BACKGROUND_ALARM') {
    const testAlarm = event.data.alarm;
    event.waitUntil(
      (async () => {
        const current = await getAlarmsFromDB();
        current.push(testAlarm);
        await saveAlarmsToDB(current);
        scheduleNearestAlarm();
      })()
    );
  } else if (event.data.type === 'CHECK_NOW') {
    event.waitUntil(checkDueAlarms());
  } else if (event.data.type === 'DISMISS_ALARM') {
    event.waitUntil(
      (async () => {
        await removeAlarmFromDB(event.data.id);
        scheduleNearestAlarm();
      })()
    );
  }
});

// Periodic Background Sync (Android Chrome PWA support)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-memory-alarms') {
    event.waitUntil(checkDueAlarms());
  }
});

// Regular Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-memory-alarms') {
    event.waitUntil(checkDueAlarms());
  }
});

// Handle clicking on the system notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const alarmId = event.notification.data?.id;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            id: alarmId,
            openAlarmModal: true,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/?openAlarm=' + encodeURIComponent(alarmId || ''));
      }
    })
  );
});
