import { MemoryItem } from '../types';

const STORAGE_KEY = 'MEMORY_POCKET_STATE_V1';

// Initial deployment state: completely empty for new users
export const INITIAL_MEMORIES: MemoryItem[] = [];

// Sample data for preview / testing if explicitly loaded by user in Settings
export const SAMPLE_MEMORIES: MemoryItem[] = [
  // Active Notifications (sorted by closest upcoming time, none at bottom)
  {
    id: 'notif_1',
    type: 'notification',
    title: 'B3층 엘리베이터 우측 주차 (A구역 14번)',
    desc: '기둥 뒤 노란 라인 바로 앞. 출차 시 정산기 사전 등록 필수',
    createdAt: Date.now() - 1000 * 60 * 15,
    notifyMode: 'relative',
    notifyAt: Date.now() + 1000 * 60 * 40,
    timeLabel: '40분 뒤 (오후 3:10)',
    isCompleted: false,
  },
  {
    id: 'notif_2',
    type: 'notification',
    title: '세탁소 패딩 맡긴 것 찾으러 가기',
    desc: '영수증 안 가져가도 폰 번호 뒷자리로 확인 가능하다고 하셨음',
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
    notifyMode: 'calendar',
    notifyAt: Date.now() + 1000 * 60 * 60 * 4,
    timeLabel: '오늘 오후 7:00',
    isCompleted: false,
  },
  {
    id: 'notif_3',
    type: 'notification',
    title: '내일 모레 여권 및 비자 서류 챙기기',
    desc: '컬러 사본 2장, 비행기 e-티켓 출력본 서재 파우치에 넣기',
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    notifyMode: 'calendar',
    notifyAt: Date.now() + 1000 * 60 * 60 * 24,
    timeLabel: '내일 오전 10:00',
    isCompleted: false,
  },
  {
    id: 'notif_4',
    type: 'notification',
    title: '건전지 AA형 4개 사기',
    desc: '도어락 비상용 여분 팩 함께 확인',
    createdAt: Date.now() - 1000 * 60 * 60 * 8,
    notifyMode: 'none',
    timeLabel: '알림 없음',
    isCompleted: false,
  },

  // Active Archives
  {
    id: 'arch_1',
    type: 'archive',
    title: '현관 도어락 #1024* (비상 출입구 #9988#)',
    desc: '방문차량 등록 및 택배 기사님용 임시 번호 포함',
    category: '계정/비번',
    isLocked: true,
    lockHint: '아파트 현관 비밀번호',
    pin: '7788',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    isCompleted: false,
  },
  {
    id: 'arch_2',
    type: 'archive',
    title: '비상금 통장 카카오뱅크: 3333-01-9876543',
    desc: '적금 만기 이체 계좌 및 생활비 비상금 예치용',
    category: '금융 메모',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    isCompleted: false,
  },
  {
    id: 'arch_3',
    type: 'archive',
    title: '주차위치: 지하 2층 D구역 기둥 14번',
    desc: '월정기 주차 지정석 (전기차 충전 구역 맞은편)',
    category: '기타',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    isCompleted: false,
  },
  {
    id: 'arch_4',
    type: 'archive',
    title: '집 와이파이 비밀번호 & 통신사 고객센터',
    desc: 'SKB_WiFi_G542 (pw: 240801a!#) / 인터넷 장애 접수: 106',
    category: '가정',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    updatedAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    isCompleted: false,
  },

  // Completed Memories (initial 8 items as in Image 3 screenshot)
  {
    id: 'comp_1',
    type: 'notification',
    title: 'B3층 엘리베이터 우측 주차 (A구역 14번)',
    desc: '카카오내비 주차 위치 마커 연동됨',
    createdAt: Date.now() - 1000 * 60 * 60,
    isCompleted: true,
    completedAt: Date.now() - 1000 * 60 * 2, // 방금 전
    completedOrigin: 'notification',
    completedReason: 'completed',
  },
  {
    id: 'comp_2',
    type: 'archive',
    title: '지난 여름 제주 렌트카 예약번호 2023-JJ',
    desc: '제주공항 1터미널 3번 셔틀버스 승차 구역',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    isCompleted: true,
    completedAt: Date.now() - 1000 * 60 * 60 * 24, // 어제 14:20
    completedOrigin: 'archive',
    completedReason: 'deleted',
  },
  {
    id: 'comp_3',
    type: 'notification',
    title: '점심 식사 후 비타민 챙겨먹기',
    desc: '오메가3 1알 + 비타민 B 복합체 식후 즉시',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    isCompleted: true,
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 2, // 2일 전
    completedOrigin: 'notification',
    completedReason: 'completed',
  },
  {
    id: 'comp_4',
    type: 'archive',
    title: '임시 와이파이 비번: guest1234!',
    desc: '스튜디오 미팅룸 전용 5G 공유기 접속 키',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
    isCompleted: true,
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3일 전
    completedOrigin: 'archive',
    completedReason: 'deleted',
  },
  {
    id: 'comp_5',
    type: 'notification',
    title: '도서관 반납 예정 도서 2권 챙기기',
    desc: '미드나잇 라이브러리, 클린 아키텍처',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 4,
    isCompleted: true,
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 4, // 4일 전
    completedOrigin: 'notification',
    completedReason: 'completed',
  },
  {
    id: 'comp_6',
    type: 'notification',
    title: '오후 3시 정기 건강검진 문진표 작성',
    desc: '사전 모바일 설문 완료 및 신분증 지참',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 5,
    isCompleted: true,
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 5, // 5일 전
    completedOrigin: 'notification',
    completedReason: 'completed',
  },
  {
    id: 'comp_7',
    type: 'archive',
    title: '신규 프로젝트 클라우드 서버 접속 IP 메모',
    desc: '192.168.0.120:8080 (내부망 접속 전용)',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 6,
    isCompleted: true,
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 6, // 6일 전
    completedOrigin: 'archive',
    completedReason: 'deleted',
  },
  {
    id: 'comp_8',
    type: 'notification',
    title: '공동현관 비밀번호 임시 변경 건 공지 확인',
    desc: '관리사무소 출입문 패드 정기 교체 완료',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
    isCompleted: true,
    completedAt: Date.now() - 1000 * 60 * 60 * 24 * 7, // 1주일 전
    completedOrigin: 'notification',
    completedReason: 'completed',
  },

  // Trashed Memories (Initial demo items in trash)
  {
    id: 'trash_1',
    type: 'notification',
    title: '지난달 정기 주차권 갱신 알림',
    desc: '관리사무소 키오스크에서 현장 결제 완료됨',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 10,
    isDeleted: true,
    deletedAt: Date.now() - 1000 * 60 * 60 * 24 * 4, // 4일 전 삭제됨 (26일 남음)
    deletedOrigin: 'notification',
  },
  {
    id: 'trash_2',
    type: 'archive',
    title: '구 사옥 회의실 도어락 임시 비번: 7890*',
    desc: '이전 사무실 이전으로 더 이상 사용 안 함',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 20,
    isDeleted: true,
    deletedAt: Date.now() - 1000 * 60 * 60 * 24 * 12, // 12일 전 삭제됨 (18일 남음)
    deletedOrigin: 'archive',
  },
];

export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function filterOutExpiredTrash(memories: MemoryItem[]): MemoryItem[] {
  const now = Date.now();
  return memories.filter((m) => {
    if (m.isDeleted && m.deletedAt) {
      return now - m.deletedAt < THIRTY_DAYS_MS;
    }
    return true;
  });
}

export function getRemainingTrashDays(deletedAt?: number): number {
  if (!deletedAt) return 30;
  const elapsedDays = Math.floor((Date.now() - deletedAt) / 86400000);
  return Math.max(1, 30 - elapsedDays);
}

export function loadMemories(): MemoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    // Auto-purge items in trash older than 30 days
    const activeAndNonExpired = filterOutExpiredTrash(parsed);
    if (activeAndNonExpired.length !== parsed.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(activeAndNonExpired));
    }
    return activeAndNonExpired;
  } catch {
    return [];
  }
}

export function clearAllMemories(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (e) {
    console.error('Failed to clear memories', e);
  }
}

export function getSampleMemories(): MemoryItem[] {
  return SAMPLE_MEMORIES.map((m) => ({
    ...m,
    id: `sample_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  }));
}

export function saveMemories(memories: MemoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  } catch (e) {
    console.error('Failed to save memories to localStorage', e);
  }
}

export function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return '방금 전';
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 1) return '어제 14:20';
  if (days < 7) return `${days}일 전`;
  return `${Math.floor(days / 7)}주일 전`;
}

// Default and dynamic custom categories
export const DEFAULT_CATEGORIES = ['자주 찾는 정보', '생활', '금융', '계정/비번', '차량'];

const CUSTOM_CATEGORIES_KEY = 'MEMORY_POCKET_CUSTOM_CATEGORIES_V1';

export function getAvailableCategories(): string[] {
  try {
    const saved = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const custom: string[] = saved ? JSON.parse(saved) : [];
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...custom]));
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function addCustomCategory(cat: string): string[] {
  const clean = cat.replace(/^#/, '').trim();
  if (!clean || clean === '없음') return getAvailableCategories();
  try {
    const saved = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
    const custom: string[] = saved ? JSON.parse(saved) : [];
    if (!custom.includes(clean) && !DEFAULT_CATEGORIES.includes(clean)) {
      custom.push(clean);
      localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(custom));
    }
  } catch {}
  return getAvailableCategories();
}
