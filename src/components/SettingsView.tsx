import React, { useState, useEffect } from 'react';
import {
  getNotificationPermissionState,
  requestNotificationPermission,
  testPhoneAlarmAndVibration,
  isIOSDevice,
  isStandaloneMode,
  isAndroidDevice,
  NotificationPermissionState,
} from '../utils/notification';
import { MemoryItem } from '../types';
import { sound } from '../utils/sound';

interface SettingsViewProps {
  onBackToMain: () => void;
  memories: MemoryItem[];
  onImportMemories: (imported: MemoryItem[]) => void;
  onClearAllMemories: () => void;
  onLoadSampleMemories: () => void;
  onTriggerTestAlarm: () => void;
  onShowToast: (msg: string) => void;
  onOpenTrash: () => void;
  trashedCount: number;
  onOpenTutorial: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBackToMain,
  memories,
  onImportMemories,
  onClearAllMemories,
  onLoadSampleMemories,
  onTriggerTestAlarm,
  onShowToast,
  onOpenTrash,
  trashedCount,
  onOpenTutorial,
}) => {
  const [permState, setPermState] = useState<NotificationPermissionState>('default');
  const [isTesting, setIsTesting] = useState(false);

  // Platform detection
  const isIOS = isIOSDevice();
  const isAndroid = isAndroidDevice();
  const isStandalone = isStandaloneMode();

  // Settings states stored in localStorage
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(() => {
    return localStorage.getItem('setting_vibration') !== 'false';
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('setting_sound') !== 'false';
  });
  const [autoPopupEnabled, setAutoPopupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('setting_autopopup') !== 'false';
  });
  const [autoLockSeconds, setAutoLockSeconds] = useState<number>(() => {
    const saved = localStorage.getItem('setting_autolock');
    return saved ? parseInt(saved, 10) : 30;
  });

  // PIN settings state
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  useEffect(() => {
    setPermState(getNotificationPermissionState());
  }, []);

  const handleToggleVibration = () => {
    sound.playClick();
    const next = !vibrationEnabled;
    setVibrationEnabled(next);
    localStorage.setItem('setting_vibration', String(next));
    onShowToast(next ? '진동 알림이 켜졌습니다 📳' : '진동 알림이 꺼졌습니다');
  };

  const handleToggleSound = () => {
    sound.playClick();
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('setting_sound', String(next));
    onShowToast(next ? '효과음 사운드가 켜졌습니다 🔔' : '효과음 사운드가 꺼졌습니다 🔇');
  };

  const handleToggleAutoPopup = () => {
    sound.playClick();
    const next = !autoPopupEnabled;
    setAutoPopupEnabled(next);
    localStorage.setItem('setting_autopopup', String(next));
    onShowToast(next ? '알림 도래 시 메모 전체 팝업 켜짐 ✨' : '메모 전체 팝업 꺼짐');
  };

  const handleChangeAutoLock = (sec: number) => {
    sound.playClick();
    setAutoLockSeconds(sec);
    localStorage.setItem('setting_autolock', String(sec));
    onShowToast(`보안 메모 자동 잠금: ${sec}초로 설정`);
  };

  const handleRequestPermission = async () => {
    sound.playClick();
    const res = await requestNotificationPermission();
    setPermState(res);
    if (res === 'granted') {
      onShowToast('스마트폰 알림 및 진동이 허용되었습니다! 🔔📳');
    } else if (res === 'denied') {
      onShowToast('브라우저 설정에서 알림 권한을 허용해주세요.');
    }
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    const result = await testPhoneAlarmAndVibration();
    setIsTesting(false);
    onShowToast(result.message);
    setPermState(getNotificationPermissionState());

    if (onTriggerTestAlarm) {
      setTimeout(() => {
        onTriggerTestAlarm();
      }, 500);
    }
  };

  // Export JSON Backup
  const handleExportData = () => {
    sound.playClick();
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(memories, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute(
        'download',
        `기억주머니_백업_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      onShowToast('기억 데이터가 JSON 백업 파일로 저장되었습니다 💾');
    } catch {
      onShowToast('백업 생성 중 오류가 발생했습니다.');
    }
  };

  // Import JSON Backup
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) {
          onImportMemories(parsed);
          onShowToast(`${parsed.length}개의 기억이 성공적으로 복원되었습니다 ✨`);
        } else {
          onShowToast('올바른 백업 파일 형식이 아닙니다.');
        }
      } catch {
        onShowToast('파일 읽기 오류가 발생했습니다.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // PIN Save
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      onShowToast('PIN 번호는 숫자 4자리여야 합니다.');
      return;
    }
    if (newPin !== confirmPin) {
      onShowToast('PIN 확인 번호가 일치하지 않습니다.');
      return;
    }
    localStorage.setItem('memory_custom_pin', newPin);
    setIsChangingPin(false);
    setNewPin('');
    setConfirmPin('');
    sound.playCompleteChime();
    onShowToast('비밀 보관함 PIN 번호가 변경되었습니다 🔒');
  };

  const isGranted = permState === 'granted';
  const isDenied = permState === 'denied';

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#faf9f5] pb-24">
      {/* Top Header with Back Navigation */}
      <div className="sticky top-0 z-40 pt-safe bg-[#faf9f5]/95 backdrop-blur-md border-b border-[#e9e8e4]">
        <div className="h-14 px-4 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToMain}
            className="w-10 h-10 -ml-2 rounded-xl flex items-center justify-center text-[#554335] hover:bg-[#efeeea] active:scale-95 transition-all cursor-pointer"
            aria-label="메인 화면으로 돌아가기"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <div className="flex flex-col items-center">
            <h1 className="font-bold text-[17px] text-[#1b1c1a]">설정</h1>
            <span className="text-[10px] text-[#887362]">알림·진동 및 환경설정</span>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="p-4 flex flex-col gap-5 max-w-md mx-auto w-full">
        {/* ========================================================= */}
        {/* 1. 알림 & 진동 설정 (네모칸으로 요청하신 핵심 알림 설정) */}
        {/* ========================================================= */}
        <section className="bg-white rounded-3xl p-4 shadow-sm border-2 border-[#f78f10]/40 flex flex-col gap-3 relative overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-[#efeeea]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#fef0e3] text-[#f78f10] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">notifications_active</span>
              </div>
              <div>
                <h2 className="font-bold text-[15px] text-[#1b1c1a]">핸드폰 알림 & 진동 설정</h2>
                <p className="text-[11px] text-[#887362]">앱을 켜두지 않아도 알림 시간에 맞춰 작동</p>
              </div>
            </div>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                isGranted
                  ? 'bg-[#e8f5e9] text-[#2e7d32]'
                  : isDenied
                  ? 'bg-[#ffebee] text-[#c62828]'
                  : 'bg-[#fff8e1] text-[#e65100]'
              }`}
            >
              {isGranted ? '작동 중' : isDenied ? '차단됨' : '설정 필요'}
            </span>
          </div>

          {/* Status Alert Banner */}
          <div
            className={`p-3.5 rounded-2xl border flex flex-col gap-2 transition-all ${
              isGranted
                ? 'bg-[#e8f5e9]/70 border-[#81c784]/40 text-[#1b5e20]'
                : isDenied
                ? 'bg-[#ffebee]/80 border-[#ef9a9a]/50 text-[#b71c1c]'
                : 'bg-[#fff8e1]/80 border-[#ffe082]/60 text-[#e65100]'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold">
              <span className="material-symbols-outlined text-[17px]">
                {isGranted ? 'verified' : isDenied ? 'error' : 'notification_important'}
              </span>
              <span>
                {isGranted
                  ? '스마트폰 화면 알림 & 진동이 활성화되어 있습니다'
                  : isDenied
                  ? '브라우저 알림 권한이 차단되어 있습니다'
                  : '스마트폰 알림 권한 허용이 필요합니다'}
              </span>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed break-keep">
              {isGranted
                ? '설정한 알림 시간에 스마트폰 상단 알림 바와 잠금화면에 알림 창이 팝업되고 진동이 울립니다.'
                : isDenied
                ? '브라우저 상단 주소창 자물쇠(🔒) 아이콘을 눌러 사이트 설정에서 알림을 "허용"으로 변경해주세요.'
                : '아래 버튼을 눌러 브라우저 알림을 허용하시면 앱에 들어가지 않아도 알림과 진동이 울립니다.'}
            </p>

            {!isGranted && (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="mt-1 w-full py-2.5 rounded-xl bg-[#f78f10] hover:bg-[#e07c08] active:scale-98 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">notifications</span>
                지금 핸드폰 알림 & 진동 허용하기
              </button>
            )}
          </div>

          {/* Toggle Switches */}
          <div className="flex flex-col gap-2.5 pt-1">
            {/* 1. Vibration Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#faf9f5] border border-[#efeeea]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[#f78f10]">
                  vibration
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1b1c1a]">스마트폰 진동 피드백</span>
                  <span className="text-[10.5px] text-[#887362]">알림 시 [징- 징- 징징징] 진동 울림</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleVibration}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  vibrationEnabled ? 'bg-[#f78f10]' : 'bg-[#dbdad6]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.75 ${
                    vibrationEnabled ? 'right-0.75' : 'left-0.75'
                  }`}
                />
              </button>
            </div>

            {/* 2. Sound Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#faf9f5] border border-[#efeeea]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[#f78f10]">
                  volume_up
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1b1c1a]">선명한 알림 사운드</span>
                  <span className="text-[10.5px] text-[#887362]">맑고 또렷한 듀얼 벨 톤 사운드 재생</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleSound}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  soundEnabled ? 'bg-[#f78f10]' : 'bg-[#dbdad6]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.75 ${
                    soundEnabled ? 'right-0.75' : 'left-0.75'
                  }`}
                />
              </button>
            </div>

            {/* 3. Full Memo Popup Toggle */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#faf9f5] border border-[#efeeea]">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[#f78f10]">
                  visibility
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1b1c1a]">알림 도래 시 메모 전체 팝업</span>
                  <span className="text-[10.5px] text-[#887362]">제목·내용·태그가 포함된 메모 창 즉시 팝업</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggleAutoPopup}
                className={`w-12 h-6.5 rounded-full transition-colors relative cursor-pointer ${
                  autoPopupEnabled ? 'bg-[#f78f10]' : 'bg-[#dbdad6]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.75 ${
                    autoPopupEnabled ? 'right-0.75' : 'left-0.75'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Instant Test Button */}
          <button
            type="button"
            disabled={isTesting}
            onClick={handleRunTest}
            className="w-full py-3 rounded-2xl bg-[#1b1c1a] hover:bg-[#333330] active:scale-98 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-1"
          >
            <span className="material-symbols-outlined text-[17px] text-[#f78f10]">
              vibration
            </span>
            {isTesting ? '테스트 실행 중...' : '알림 & 진동 즉시 테스트하기'}
          </button>

          {/* Mobile OS Specific Background Guidance */}
          {isIOS && !isStandalone && (
            <div className="mt-1 p-3.5 rounded-2xl bg-[#fff3e0] border border-[#ffb74d] text-xs text-[#b26a00] flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#e65100]">
                <span className="material-symbols-outlined text-[18px]">apple</span>
                아이폰(iOS) 백그라운드 알림 필수 설정
              </div>
              <p className="text-[11px] leading-relaxed break-keep text-[#8c4400]">
                애플(iOS) 보안 정책상 <strong>Safari 브라우저 탭을 닫으면 백그라운드 알림이 원천 차단</strong>됩니다.
                <br />
                앱을 나갔을 때도 알림을 받으시려면:
                <br />
                1. Safari 하단 <strong>공유(네모+화살표)</strong> 버튼 터치
                <br />
                2. <strong>[홈 화면에 추가]</strong> 터치하여 아이콘 설치
                <br />
                3. 설치된 홈 화면 아이콘으로 실행하시면 앱을 닫아두어도 알림과 진동이 100% 정상 작동합니다!
              </p>
            </div>
          )}

          {isAndroid && (
            <div className="mt-1 p-3.5 rounded-2xl bg-[#e8f5e9] border border-[#a5d6a7] text-xs text-[#1b5e20] flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 font-bold text-[#2e7d32]">
                <span className="material-symbols-outlined text-[18px]">android</span>
                갤럭시(안드로이드) 백그라운드 알림 최적화 팁
              </div>
              <p className="text-[11px] leading-relaxed break-keep text-[#2e7d32]">
                앱을 완전히 닫아두어도 정시에 확실한 알림을 받으시려면, 스마트폰 <strong>[설정] ➔ [애플리케이션] ➔ [Chrome] ➔ [배터리] ➔ '제한 없음(최적화 안 함)'</strong>으로 설정하시고 브라우저 메뉴의 <strong>[홈 화면에 추가]</strong>를 이용해주세요.
              </p>
            </div>
          )}
        </section>

        {/* ========================================================= */}
        {/* 2. 비밀 보관함 & PIN 보안 설정 */}
        {/* ========================================================= */}
        <section className="bg-white rounded-3xl p-4 shadow-sm border border-[#e9e8e4] flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#efeeea]">
            <div className="w-8 h-8 rounded-xl bg-[#f2ddbe]/60 text-[#8e4f00] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">lock</span>
            </div>
            <div>
              <h2 className="font-bold text-[15px] text-[#1b1c1a]">비밀 보관함 & 보안 설정</h2>
              <p className="text-[11px] text-[#887362]">PIN 번호 암호화 및 자동 잠금 관리</p>
            </div>
          </div>

          {/* Auto Lock Seconds Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-[#1b1c1a]">보안 메모 자동 잠금 시간</span>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => handleChangeAutoLock(sec)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    autoLockSeconds === sec
                      ? 'bg-[#8e4f00] text-white border-[#8e4f00] shadow-xs'
                      : 'bg-[#faf9f5] text-[#554335] border-[#e9e8e4] hover:bg-[#f0eee9]'
                  }`}
                >
                  {sec}초 후 잠금
                </button>
              ))}
            </div>
          </div>

          {/* Custom PIN Changer */}
          <div className="pt-2 border-t border-[#f0eee9]">
            {!isChangingPin ? (
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-[#1b1c1a]">비밀번호 (PIN 번호)</span>
                  <span className="text-[11px] text-[#887362]">
                    {localStorage.getItem('memory_custom_pin') ? '사용자 정의 PIN 적용됨' : '기본 PIN: 1234'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChangingPin(true)}
                  className="px-3 py-1.5 rounded-xl bg-[#faf9f5] hover:bg-[#f0eee9] text-[#554335] font-semibold text-xs border border-[#e9e8e4] transition-colors cursor-pointer"
                >
                  PIN 변경
                </button>
              </div>
            ) : (
              <form onSubmit={handleSavePin} className="flex flex-col gap-2.5 p-3 rounded-2xl bg-[#faf9f5] border border-[#e9e8e4]">
                <span className="text-xs font-bold text-[#1b1c1a]">새 숫자 4자리 PIN 입력</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="새 PIN 4자리"
                    className="p-2 text-center rounded-xl bg-white border border-[#dbdad6] text-sm focus:outline-none focus:ring-1 focus:ring-[#f78f10]"
                  />
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="PIN 확인"
                    className="p-2 text-center rounded-xl bg-white border border-[#dbdad6] text-sm focus:outline-none focus:ring-1 focus:ring-[#f78f10]"
                  />
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[#8e4f00] text-white text-xs font-bold cursor-pointer hover:bg-[#733f00]"
                  >
                    변경 저장
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsChangingPin(false)}
                    className="px-3 py-2 rounded-xl bg-[#e9e8e4] text-[#554335] text-xs font-semibold cursor-pointer"
                  >
                    취소
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. 데이터 관리 & 개인정보 격리 보장 */}
        {/* ========================================================= */}
        <section className="bg-white rounded-3xl p-4 shadow-sm border border-[#e9e8e4] flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#efeeea]">
            <div className="w-8 h-8 rounded-xl bg-[#f5f4f0] text-[#554335] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">security</span>
            </div>
            <div>
              <h2 className="font-bold text-[15px] text-[#1b1c1a]">데이터 보안 & 개인정보 보장</h2>
              <p className="text-[11px] text-[#887362]">타인 공유 불가 · 100% 개인 기기 독립 보관</p>
            </div>
          </div>

          {/* Privacy & Zero-Sharing Guarantee Card */}
          <div className="p-3.5 rounded-2xl bg-[#e8f5e9]/70 border border-[#81c784]/40 flex flex-col gap-1.5 text-xs text-[#1b5e20]">
            <div className="flex items-center gap-1.5 font-bold">
              <span className="material-symbols-outlined text-[17px] text-[#2e7d32]">verified_user</span>
              개인 기기 100% 격리 (타인 공유 불가)
            </div>
            <p className="text-[11px] text-[#2e7d32]/90 leading-relaxed break-keep">
              작성하신 알림 및 보관 메모는 사용자의 스마트폰 로컬 저장소에만 독립적으로 보관됩니다. 외부 서버나 타인과 절대 공유되지 않으며 본인만 열람할 수 있습니다.
            </p>
          </div>

          {/* Backup & Restore Buttons */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-xs font-bold text-[#1b1c1a]">데이터 백업 및 가져오기</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportData}
                className="py-2.5 px-3 rounded-2xl bg-[#faf9f5] hover:bg-[#f0eee9] active:scale-98 text-[#554335] font-semibold text-xs border border-[#e9e8e4] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px] text-[#f78f10]">file_download</span>
                데이터 백업 (JSON)
              </button>

              <label className="py-2.5 px-3 rounded-2xl bg-[#faf9f5] hover:bg-[#f0eee9] active:scale-98 text-[#554335] font-semibold text-xs border border-[#e9e8e4] flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                <span className="material-symbols-outlined text-[17px] text-[#2e7d32]">file_upload</span>
                데이터 복원
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Reset / Sample Data Actions */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-[#efeeea]">
            <span className="text-xs font-bold text-[#1b1c1a]">배포용 초기화 & 샘플 관리</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('현재 저장된 모든 메모를 비우고 배포용 빈 상태(0건)로 초기화할까요?')) {
                    onClearAllMemories();
                    onShowToast('모든 메모가 비워졌습니다 (배포용 클린 상태) 🧹');
                  }
                }}
                className="py-2.5 px-2.5 rounded-2xl bg-[#fff0f0] hover:bg-[#ffe5e5] active:scale-98 text-[#ba1a1a] font-bold text-[11.5px] border border-[#ffcdd2] flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="모든 메모를 비우고 신규 사용자용 백지 상태로 초기화"
              >
                <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                모든 메모 비우기 (클린)
              </button>

              <button
                type="button"
                onClick={() => {
                  onLoadSampleMemories();
                  onShowToast('체험용 샘플 메모 8건이 등록되었습니다 📦');
                }}
                className="py-2.5 px-2.5 rounded-2xl bg-[#faf9f5] hover:bg-[#f0eee9] active:scale-98 text-[#554335] font-semibold text-[11.5px] border border-[#e9e8e4] flex items-center justify-center gap-1 transition-all cursor-pointer"
                title="기능 테스트용 샘플 메모 다시 불러오기"
              >
                <span className="material-symbols-outlined text-[16px] text-[#f78f10]">auto_stories</span>
                샘플 메모 불러오기
              </button>
            </div>
          </div>

          {/* Trash shortcut */}
          <div
            onClick={onOpenTrash}
            className="p-3 rounded-2xl bg-[#faf9f5] border border-[#efeeea] flex items-center justify-between cursor-pointer hover:bg-[#f0eee9] transition-colors mt-1"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-[#ba1a1a]">delete</span>
              <span className="text-xs font-semibold text-[#1b1c1a]">휴지통 (30일 보관소) 열기</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#887362]">
              <span>{trashedCount}건 보관 중</span>
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. 기억주머니 사용 설명서 (튜토리얼 다시 보기) */}
        {/* ========================================================= */}
        <section className="bg-white rounded-3xl p-4 shadow-sm border border-[#e9e8e4] flex flex-col gap-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[#efeeea]">
            <div className="w-8 h-8 rounded-xl bg-[#fef0e3] text-[#f78f10] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
            </div>
            <div>
              <h2 className="font-bold text-[15px] text-[#1b1c1a]">기억주머니 사용 설명서</h2>
              <p className="text-[11px] text-[#887362]">핵심 기능 및 스마트폰 알림 꿀팁 모음</p>
            </div>
          </div>

          <p className="text-xs text-[#554335] leading-relaxed break-keep">
            시한성 알림과 상시성 보관 활용법, 스마트폰 백그라운드 알림 수신 팁(강제 종료 금지 공지), 기본 캘린더 등록법을 언제든 다시 확인하실 수 있습니다.
          </p>

          <button
            type="button"
            onClick={onOpenTutorial}
            className="w-full py-3 rounded-2xl bg-[#faf9f5] hover:bg-[#f0eee9] active:scale-98 text-[#554335] font-bold text-xs border border-[#e9e8e4] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <span className="material-symbols-outlined text-[18px] text-[#f78f10]">
              auto_stories
            </span>
            사용 설명서 (튜토리얼) 다시 보기
          </button>
        </section>

        {/* ========================================================= */}
        {/* 5. 앱 정보 & 모바일 PWA 안내 */}
        {/* ========================================================= */}
        <section className="bg-white rounded-3xl p-4 shadow-sm border border-[#e9e8e4] flex flex-col gap-2.5 text-xs text-[#554335]">
          <div className="flex items-center justify-between pb-2 border-b border-[#efeeea]">
            <span className="font-bold text-[#1b1c1a]">기억주머니 (Memory Pocket)</span>
            <span className="text-[11px] font-semibold text-[#887362]">v1.3.0 PWA</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#efeeea] flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#1b1c1a]">
              <span className="material-symbols-outlined text-[16px] text-[#f78f10]">install_mobile</span>
              모바일 홈 화면 추가 팁
            </div>
            <p className="text-[11px] text-[#887362] leading-relaxed break-keep">
              브라우저 메뉴에서 <strong>[홈 화면에 추가]</strong>를 누르시면 스마트폰 앱 형태로 설치되어, 앱을 완전히 닫아두어도 알림과 진동을 가장 확실하게 받아보실 수 있습니다.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
