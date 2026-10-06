import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TabType, MemoryItem, AppView } from './types';
import {
  loadMemories,
  saveMemories,
  filterOutExpiredTrash,
  clearAllMemories,
  getSampleMemories,
} from './utils/storage';
import { sound } from './utils/sound';
import { keepAliveEngine } from './utils/keepAlive';
import {
  initServiceWorker,
  getNotificationPermissionState,
  syncAlarmsToServiceWorker,
  triggerPhoneNotification,
  NotificationPermissionState,
} from './utils/notification';
import { Header } from './components/Header';
import { TabSwitcher } from './components/TabSwitcher';
import { NotificationTab } from './components/NotificationTab';
import { ArchiveTab } from './components/ArchiveTab';
import { CompletedView } from './components/CompletedView';
import { TrashView } from './components/TrashView';
import { NewMemoryDrawer } from './components/NewMemoryDrawer';
import { EditMemoryDrawer } from './components/EditMemoryDrawer';
import { AlarmMemoModal } from './components/AlarmMemoModal';
import { PinAuthModal } from './components/PinAuthModal';
import { SecureFocusViewer } from './components/SecureFocusViewer';
import { SettingsView } from './components/SettingsView';
import { TutorialModal } from './components/TutorialModal';
import { Toast } from './components/Toast';

export default function App() {
  const [memories, setMemories] = useState<MemoryItem[]>(() => loadMemories());
  const [activeTab, setActiveTab] = useState<TabType>('notification');
  const [view, setView] = useState<AppView>('main');

  // Modals & Drawers
  const [isNewDrawerOpen, setIsNewDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MemoryItem | null>(null);
  const [pinModalItem, setPinModalItem] = useState<MemoryItem | null>(null);
  const [secureViewerItem, setSecureViewerItem] = useState<MemoryItem | null>(null);
  const [notifPermission, setNotifPermission] = useState<NotificationPermissionState>('default');
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(() => {
    return localStorage.getItem('memory_tutorial_seen') !== 'true';
  });

  // Alarm Full Memo Modal & Highlighting
  const [alarmModalItem, setAlarmModalItem] = useState<MemoryItem | null>(null);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  }, []);

  // Sync to localStorage whenever memories change and purge 30-day expired trash
  useEffect(() => {
    const unexpired = filterOutExpiredTrash(memories);
    if (unexpired.length !== memories.length) {
      setMemories(unexpired);
      saveMemories(unexpired);
    } else {
      saveMemories(memories);
    }
  }, [memories]);

  // Active items, completed, and trash counts
  const activeNotifications = memories.filter((m) => m.type === 'notification' && !m.isCompleted && !m.isDeleted);
  const activeArchives = memories.filter((m) => m.type === 'archive' && !m.isCompleted && !m.isDeleted);
  const completedMemories = memories.filter((m) => m.isCompleted && !m.isDeleted);
  const trashedMemories = memories.filter((m) => m.isDeleted);

  // Initialize Service Worker & System Notification Click Handling
  useEffect(() => {
    initServiceWorker();
    setNotifPermission(getNotificationPermissionState());

    const handleNotifClick = (e: Event) => {
      const custom = e as CustomEvent<{ id?: string; openAlarmModal?: boolean }>;
      if (custom.detail?.id) {
        setActiveTab('notification');
        const item = memories.find((m) => m.id === custom.detail.id);
        if (item) {
          setAlarmModalItem(item);
          setIsAlarmModalOpen(true);
          handleInspectAlarm(item);
        }
      }
    };

    // Check direct link from notification URL
    try {
      const params = new URLSearchParams(window.location.search);
      const openAlarmId = params.get('openAlarm');
      if (openAlarmId) {
        const item = memories.find((m) => m.id === openAlarmId);
        if (item) {
          setAlarmModalItem(item);
          setIsAlarmModalOpen(true);
          setActiveTab('notification');
        }
      }
    } catch {}

    window.addEventListener('MEMORY_NOTIFICATION_CLICK', handleNotifClick);
    return () => {
      window.removeEventListener('MEMORY_NOTIFICATION_CLICK', handleNotifClick);
    };
  }, [memories]);

  // Sync scheduled alarms to Service Worker and IndexedDB for background checking even when app is closed
  useEffect(() => {
    syncAlarmsToServiceWorker(activeNotifications);
  }, [activeNotifications]);

  // Keep-alive warm up on user gesture
  useEffect(() => {
    const handleWarmGesture = () => {
      if (activeNotifications.length > 0) {
        keepAliveEngine.start();
      }
    };
    window.addEventListener('click', handleWarmGesture, { passive: true });
    window.addEventListener('touchstart', handleWarmGesture, { passive: true });
    return () => {
      window.removeEventListener('click', handleWarmGesture);
      window.removeEventListener('touchstart', handleWarmGesture);
    };
  }, [activeNotifications]);

  // Periodic Reminder Checker (Foreground, Off-thread Web Worker & Visibility Change)
  const triggeredIdsRef = useRef<Set<string>>(new Set());

  // Listen for due alarms from dedicated background worker
  useEffect(() => {
    const handleDueAlarm = (e: Event) => {
      const custom = e as CustomEvent<{ item: MemoryItem }>;
      const due = custom.detail?.item;
      if (due && !triggeredIdsRef.current.has(due.id)) {
        triggeredIdsRef.current.add(due.id);
        setAlarmModalItem(due);
        setIsAlarmModalOpen(true);
        triggerPhoneNotification(due);
      }
    };

    window.addEventListener('MEMORY_DUE_ALARM', handleDueAlarm);
    return () => {
      window.removeEventListener('MEMORY_DUE_ALARM', handleDueAlarm);
    };
  }, []);

  // Check on tab visibility change (e.g. user unlocks phone or switches back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const dueNotif = activeNotifications.find(
          (m) => m.notifyAt && m.notifyAt <= now && !triggeredIdsRef.current.has(m.id)
        );
        if (dueNotif) {
          triggeredIdsRef.current.add(dueNotif.id);
          setAlarmModalItem(dueNotif);
          setIsAlarmModalOpen(true);
          triggerPhoneNotification(dueNotif);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [activeNotifications]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const dueNotif = activeNotifications.find(
        (m) => m.notifyAt && m.notifyAt <= now && !triggeredIdsRef.current.has(m.id)
      );

      if (dueNotif) {
        triggeredIdsRef.current.add(dueNotif.id);
        // Prominently pop up the exact memo card on screen!
        setAlarmModalItem(dueNotif);
        setIsAlarmModalOpen(true);

        // Hardware Phone Notification + Physical Vibration ([징- 징- 징징징])
        triggerPhoneNotification(dueNotif);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeNotifications]);

  // 1. Complete Card (Moves to 완료 내역 with sound)
  const handleCompleteCard = (item: MemoryItem) => {
    sound.playCompleteChime();
    setMemories((prev) =>
      prev.map((m) =>
        m.id === item.id
          ? {
              ...m,
              isCompleted: true,
              completedAt: Date.now(),
              completedOrigin: m.type,
              completedReason: 'completed',
              isDeleted: false,
            }
          : m
      )
    );
    showToast('완료 내역에 저장되었습니다 ✨');

    // Close alarm memo modal if completed
    if (alarmModalItem?.id === item.id) {
      setIsAlarmModalOpen(false);
    }
  };

  // 2. Move Card to Trash (휴지통으로 이동, 30일 후 자동 삭제)
  const handleDeleteCard = (item: MemoryItem) => {
    sound.playDeleteSound();
    setMemories((prev) =>
      prev.map((m) =>
        m.id === item.id
          ? {
              ...m,
              isDeleted: true,
              deletedAt: Date.now(),
              deletedOrigin: m.type,
              isCompleted: false,
            }
          : m
      )
    );
    showToast('기억이 휴지통으로 이동했습니다 🗑️');

    if (alarmModalItem?.id === item.id) {
      setIsAlarmModalOpen(false);
    }
  };

  // 3. Restore memory from 완료 내역 to original tab
  const handleRestoreMemory = (item: MemoryItem) => {
    sound.playUndoChime();
    setMemories((prev) =>
      prev.map((m) =>
        m.id === item.id
          ? {
              ...m,
              isCompleted: false,
              completedAt: undefined,
              completedOrigin: undefined,
              completedReason: undefined,
            }
          : m
      )
    );
    showToast(`'${item.title}'이(가) ${item.completedOrigin === 'archive' ? '보관' : '알림'} 탭으로 복구되었습니다`);
  };

  // 4. Move memory from 완료 내역 to Trash (휴지통으로 이동)
  const handleDeleteCompletedToTrash = (item: MemoryItem) => {
    sound.playDeleteSound();
    setMemories((prev) =>
      prev.map((m) =>
        m.id === item.id
          ? {
              ...m,
              isDeleted: true,
              deletedAt: Date.now(),
              deletedOrigin: m.completedOrigin || m.type,
              isCompleted: false,
            }
          : m
      )
    );
    showToast('기억이 휴지통으로 이동했습니다 🗑️ (30일간 보관)');
  };

  // 5. Trash Handlers (복구, 선택 복구, 선택 삭제, 휴지통 비우기)
  const handleRestoreFromTrash = (item: MemoryItem) => {
    sound.playRestoreSound();
    setMemories((prev) =>
      prev.map((m) =>
        m.id === item.id
          ? {
              ...m,
              isDeleted: false,
              deletedAt: undefined,
              deletedOrigin: undefined,
              isCompleted: false,
            }
          : m
      )
    );
    showToast(`'${item.title}'이(가) 원래 탭으로 복구되었습니다 ↩️`);
  };

  const handleRestoreSelectedFromTrash = (ids: string[]) => {
    sound.playRestoreSound();
    const idSet = new Set(ids);
    setMemories((prev) =>
      prev.map((m) =>
        idSet.has(m.id)
          ? {
              ...m,
              isDeleted: false,
              deletedAt: undefined,
              deletedOrigin: undefined,
              isCompleted: false,
            }
          : m
      )
    );
    showToast(`${ids.length}개의 기억이 복구되었습니다 ↩️`);
  };

  const handlePermanentDeleteFromTrash = (id: string) => {
    sound.playDeleteSound();
    setMemories((prev) => prev.filter((m) => m.id !== id));
    showToast('기억이 영구 삭제되었습니다');
  };

  const handlePermanentDeleteSelectedFromTrash = (ids: string[]) => {
    sound.playDeleteSound();
    const idSet = new Set(ids);
    setMemories((prev) => prev.filter((m) => !idSet.has(m.id)));
    showToast(`${ids.length}개의 기억이 영구 삭제되었습니다`);
  };

  const handleEmptyTrash = () => {
    sound.playDeleteSound();
    setMemories((prev) => prev.filter((m) => !m.isDeleted));
    showToast('휴지통을 모두 비웠습니다');
  };

  // 5. Create new memory
  const handleCreateMemory = (newItemData: Omit<MemoryItem, 'id' | 'createdAt'>) => {
    sound.playClick();
    const newMemo: MemoryItem = {
      ...newItemData,
      id: `memo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    setMemories((prev) => [newMemo, ...prev]);
    showToast(newMemo.type === 'notification' ? '새 알림 기억이 등록되었습니다 ✨' : '새 기억이 보관되었습니다 📁');
  };

  // 6. Inline Edit in Archive Tab
  const handleSaveInlineEdit = (id: string, newTitle: string, newDesc?: string) => {
    setMemories((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              title: newTitle,
              desc: newDesc,
              updatedAt: Date.now(),
            }
          : m
      )
    );
  };

  // 7. Edit Drawer Save
  const handleSaveEditDrawer = (updatedItem: MemoryItem) => {
    setMemories((prev) => prev.map((m) => (m.id === updatedItem.id ? updatedItem : m)));
  };

  // 8. Trigger manual alarm preview / test (Opens full memo modal + phone alert)
  const handleTriggerAlarmPreview = (item: MemoryItem) => {
    setAlarmModalItem(item);
    setIsAlarmModalOpen(true);
    triggerPhoneNotification(item);
  };

  // 8.5 Snooze Alarm by specified minutes (5분 뒤 다시 알림)
  const handleSnoozeAlarm = (item: MemoryItem, minutes: number = 5) => {
    sound.playClick();
    const newNotifyAt = Date.now() + minutes * 60 * 1000;
    triggeredIdsRef.current.delete(item.id);
    setMemories((prev) =>
      prev.map((m) =>
        m.id === item.id
          ? {
              ...m,
              notifyAt: newNotifyAt,
              timeLabel: `${minutes}분 뒤 다시 알림`,
            }
          : m
      )
    );
    setIsAlarmModalOpen(false);
    showToast(`'${item.title}' 알림이 ${minutes}분 뒤로 연기되었습니다 ⏱️`);
  };

  // 9. Inspect alarm from notification click (scroll to & highlight card)
  const handleInspectAlarm = (item: MemoryItem) => {
    setView('main');
    setActiveTab(item.type);
    setHighlightedCardId(item.id);

    setTimeout(() => {
      const cardEl = document.getElementById(`card-${item.id}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    setTimeout(() => {
      setHighlightedCardId(null);
    }, 2800);
  };

  // 10. PIN Auth success -> open SecureFocusViewer
  const handlePinAuthSuccess = (item: MemoryItem) => {
    setPinModalItem(null);
    setSecureViewerItem(item);
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-[#faf9f5] flex flex-col relative text-[#1b1c1a] shadow-xl selection:bg-[#f2ddbe]">
      {/* Toast Feedback */}
      <Toast message={toastMessage} />

      {view === 'main' ? (
        <>
          {/* Main App Header */}
          <Header
            completedCount={completedMemories.length}
            trashedCount={trashedMemories.length}
            onOpenCompleted={() => setView('completed')}
            onOpenTrash={() => setView('trash')}
            onOpenSettings={() => setView('settings')}
            isNotifGranted={notifPermission === 'granted'}
            onShowToast={showToast}
          />

          {/* 2-Part Segmented Tab Switcher ("알림" / "보관") */}
          <TabSwitcher
            activeTab={activeTab}
            onTabChange={(tab) => {
              sound.playClick();
              setActiveTab(tab);
            }}
            notifCount={activeNotifications.length}
            archiveCount={activeArchives.length}
          />

          {/* Main Feed Content */}
          <main className="flex-1 w-full pt-1">
            {activeTab === 'notification' ? (
              <NotificationTab
                memories={activeNotifications}
                highlightedCardId={highlightedCardId}
                onCompleteCard={handleCompleteCard}
                onDeleteCard={handleDeleteCard}
                onEditCard={(memo) => setEditingItem(memo)}
                onTriggerAlarmPreview={handleTriggerAlarmPreview}
                onShowToast={showToast}
              />
            ) : (
              <ArchiveTab
                memories={activeArchives}
                onCompleteCard={handleCompleteCard}
                onDeleteCard={handleDeleteCard}
                onSaveInlineEdit={handleSaveInlineEdit}
                onOpenPinModal={(memo) => setPinModalItem(memo)}
                onShowToast={showToast}
              />
            )}
          </main>

          {/* Persistent Bottom Sticky Action Button */}
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-30 px-4 pb-6 pb-safe pt-3 bg-gradient-to-t from-[#faf9f5] via-[#faf9f5]/90 to-transparent backdrop-blur-xs">
            <button
              type="button"
              onClick={() => setIsNewDrawerOpen(true)}
              className={`w-full py-3.5 rounded-2xl text-white flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition-all cursor-pointer font-bold text-base ${
                activeTab === 'notification'
                  ? 'bg-[#f78f10] hover:bg-[#e07f08] shadow-[#f78f10]/30'
                  : 'bg-[#6b5c44] hover:bg-[#594d38] shadow-[#6b5c44]/30'
              }`}
            >
              <span className="material-symbols-outlined text-[22px] text-white">
                {activeTab === 'notification' ? 'check_circle' : 'inventory_2'}
              </span>
              <span>
                {activeTab === 'notification' ? '새 기억 등록하기' : '새 기억 보관하기'}
              </span>
            </button>
          </div>
        </>
      ) : view === 'completed' ? (
        /* Completed Safety Vault Screen */
        <CompletedView
          completedMemories={completedMemories}
          onBackToMain={() => setView('main')}
          onRestoreMemory={handleRestoreMemory}
          onDeleteMemory={handleDeleteCompletedToTrash}
        />
      ) : view === 'trash' ? (
        /* 30-Day Trash Screen */
        <TrashView
          trashedMemories={trashedMemories}
          onBack={() => setView('main')}
          onRestoreItem={handleRestoreFromTrash}
          onRestoreSelected={handleRestoreSelectedFromTrash}
          onPermanentDeleteItem={handlePermanentDeleteFromTrash}
          onPermanentDeleteSelected={handlePermanentDeleteSelectedFromTrash}
          onEmptyTrash={handleEmptyTrash}
        />
      ) : (
        /* Settings Screen (설정 칸) */
        <SettingsView
          onBackToMain={() => {
            setView('main');
            setNotifPermission(getNotificationPermissionState());
          }}
          memories={memories}
          onImportMemories={(imported) => {
            setMemories(imported);
            saveMemories(imported);
          }}
          onClearAllMemories={() => {
            clearAllMemories();
            setMemories([]);
          }}
          onLoadSampleMemories={() => {
            const samples = getSampleMemories();
            setMemories(samples);
            saveMemories(samples);
          }}
          onTriggerTestAlarm={() => {
            const sampleItem = memories.find(
              (m) => m.type === 'notification' && !m.isCompleted && !m.isDeleted
            ) || {
              id: 'sample_alert_test',
              type: 'notification' as const,
              title: '세탁소 패딩 맡긴 것 찾으러 가기',
              desc: '영수증 안 가져가도 폰 번호 뒷자리로 확인 가능하다고 하셨음\n퇴근길 7시 전에 들르기!',
              createdAt: Date.now(),
              timeLabel: '지금 도래',
              notifyAt: Date.now(),
            };
            handleTriggerAlarmPreview(sampleItem);
          }}
          onShowToast={showToast}
          onOpenTrash={() => setView('trash')}
          trashedCount={trashedMemories.length}
          onOpenTutorial={() => setIsTutorialOpen(true)}
        />
      )}

      {/* First-Time User Tutorial & Guide Modal */}
      <TutorialModal
        isOpen={isTutorialOpen}
        onClose={() => setIsTutorialOpen(false)}
      />

      {/* New Memory Drawer */}
      <NewMemoryDrawer
        isOpen={isNewDrawerOpen}
        activeTab={activeTab}
        onClose={() => setIsNewDrawerOpen(false)}
        onSubmit={handleCreateMemory}
        onShowToast={showToast}
      />

      {/* Edit Memory Drawer */}
      <EditMemoryDrawer
        item={editingItem}
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={handleSaveEditDrawer}
        onShowToast={showToast}
      />

      {/* PIN Authentication Modal */}
      <PinAuthModal
        item={pinModalItem}
        isOpen={!!pinModalItem}
        onClose={() => setPinModalItem(null)}
        onSuccess={handlePinAuthSuccess}
      />

      {/* Secure 30-sec Auto-Lock Focus Viewer */}
      <SecureFocusViewer
        item={secureViewerItem}
        isOpen={!!secureViewerItem}
        onClose={() => setSecureViewerItem(null)}
        onShowToast={showToast}
      />

      {/* Alarm Full Memo Modal Dialog (알림 시간 도래 시 해당 메모 내용 전체 팝업) */}
      <AlarmMemoModal
        item={alarmModalItem}
        isOpen={isAlarmModalOpen}
        onClose={() => setIsAlarmModalOpen(false)}
        onComplete={handleCompleteCard}
        onSnooze={handleSnoozeAlarm}
        onEdit={(memo) => setEditingItem(memo)}
      />
    </div>
  );
}
