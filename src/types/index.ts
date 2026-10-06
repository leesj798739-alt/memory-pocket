export type TabType = 'notification' | 'archive';

export type NotificationMode = 'relative' | 'calendar' | 'none';

export interface MemoryItem {
  id: string;
  type: 'notification' | 'archive';
  title: string;
  desc?: string;
  tags?: string[];
  createdAt: number;
  
  // Notification fields
  notifyMode?: NotificationMode;
  notifyAt?: number; // timestamp in ms
  timeLabel?: string; // e.g. "40분 뒤", "오늘 오후 7:00", "내일 오전 10:00", "알림 없음"
  
  // Archive fields
  category?: string;
  isLocked?: boolean;
  pin?: string;
  secret?: string;
  lockHint?: string; // 보안 메모 설명 (PIN 풀기 전 카드 표면에 표시되는 유일한 식별 설명)
  updatedAt?: number;
  
  // Completion / Vault fields
  isCompleted?: boolean;
  completedAt?: number;
  completedOrigin?: 'notification' | 'archive';
  completedReason?: 'completed' | 'deleted';

  // Trash fields
  isDeleted?: boolean;
  deletedAt?: number;
  deletedOrigin?: 'notification' | 'archive';
}

export type CompletedFilterType = 'all' | 'notification' | 'archive';

export type AppView = 'main' | 'completed' | 'trash' | 'settings';

