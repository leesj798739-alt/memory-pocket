import React, { useState } from 'react';
import { sound } from '../utils/sound';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      badge: '시작 가이드',
      title: '기억주머니에 오신 것을\n환영합니다!',
      icon: 'auto_stories',
      iconBg: 'bg-[#fef0e3] text-[#f78f10]',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[#554335]">
          <p className="font-semibold text-sm text-[#1b1c1a]">
            소중한 생각과 할 일을 잊지 않도록 깔끔하게 챙겨드립니다.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#efeeea] flex flex-col gap-1">
              <span className="font-bold text-[#f78f10] text-[13px] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                시한성 알림
              </span>
              <p className="text-[11px] text-[#887362]">
                약속, 마감일, 먹어야 할 약 등 제시간에 챙겨야 할 기억
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#efeeea] flex flex-col gap-1">
              <span className="font-bold text-[#8e4f00] text-[13px] flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                상시성 보관
              </span>
              <p className="text-[11px] text-[#887362]">
                계좌번호, 아이디어, 비밀 메모 등 언제든 꺼내보는 영구 기록
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      badge: '중요 필독 공지 ⭐',
      title: '스마트폰 알림을\n100% 확실하게 받는 법',
      icon: 'notifications_paused',
      iconBg: 'bg-[#fff3e0] text-[#e65100]',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[#554335]">
          <div className="p-3.5 rounded-2xl bg-[#fff8e1] border-2 border-[#f78f10]/60 flex flex-col gap-2">
            <div className="flex items-center gap-2 font-bold text-[#b26a00] text-[13px]">
              <span className="material-symbols-outlined text-[20px] text-[#f78f10]">error</span>
              앱을 '강제 종료'하지 마세요!
            </div>
            <p className="text-[12px] font-semibold text-[#1b1c1a] leading-normal break-keep">
              사용 후 '최근 실행 앱 목록'에서 위로 쓸어올려 강제 종료(Kill)하지 마시고, <span className="text-[#e65100] underline decoration-2">그냥 홈 버튼을 눌러 닫아두세요!</span>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#efeeea] flex flex-col gap-1.5 text-[11.5px] text-[#887362]">
            <p className="flex items-center gap-1 text-[#1b1c1a] font-medium">
              <span className="material-symbols-outlined text-[16px] text-[#2e7d32]">check_circle</span>
              홈 버튼으로 닫아두면 배터리 소모 없이 초절전 대기합니다.
            </p>
            <p className="flex items-center gap-1 text-[#1b1c1a] font-medium">
              <span className="material-symbols-outlined text-[16px] text-[#2e7d32]">check_circle</span>
              화면이 꺼져 있거나 다른 앱을 쓸 때도 제시간에 팝업창과 진동이 울립니다.
            </p>
          </div>
        </div>
      ),
    },
    {
      badge: '신규 기능',
      title: '스마트폰 기본 캘린더에\n1초 만에 알람 등록',
      icon: 'calendar_month',
      iconBg: 'bg-[#e8f5e9] text-[#2e7d32]',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[#554335]">
          <p className="font-semibold text-sm text-[#1b1c1a]">
            알림 메모의 <span className="text-[#2e7d32]">[캘린더 등록]</span> 버튼을 터치해 보세요.
          </p>
          <div className="p-3 rounded-2xl bg-[#e8f5e9]/60 border border-[#a5d6a7]/60 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1b5e20]">
              <span className="material-symbols-outlined text-[18px]">event_available</span>
              폰 시스템 알람과 100% 동기화
            </div>
            <p className="text-[11.5px] text-[#2e7d32] leading-relaxed break-keep">
              터치 한 번으로 아이폰 캘린더나 갤럭시 캘린더에 즉시 등록되어, 스마트폰을 껐다 켜거나 앱이 닫혀 있어도 스마트폰 OS 자체 알람이 울려 절대 놓치지 않습니다.
            </p>
          </div>
        </div>
      ),
    },
    {
      badge: '보안 & 편의',
      title: '나만의 비밀 보관함 & \n홈 화면 앱 설치',
      icon: 'lock',
      iconBg: 'bg-[#f2ddbe]/60 text-[#8e4f00]',
      content: (
        <div className="flex flex-col gap-3 text-xs leading-relaxed text-[#554335]">
          <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#efeeea] flex flex-col gap-1">
            <span className="font-bold text-[#1b1c1a] text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#8e4f00]">pin</span>
              숫자 4자리 PIN 비밀 잠금
            </span>
            <p className="text-[11px] text-[#887362] break-keep">
              민감한 금융 정보나 개인 메모는 자물쇠를 걸어 본인만 열람할 수 있습니다.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-[#faf9f5] border border-[#efeeea] flex flex-col gap-1">
            <span className="font-bold text-[#1b1c1a] text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-[#f78f10]">install_mobile</span>
              진짜 스마트폰 앱처럼 설치
            </span>
            <p className="text-[11px] text-[#887362] break-keep">
              Safari 하단 [공유] ➔ [홈 화면에 추가] 또는 Chrome [앱 설치]를 누르시면 브라우저 주소창 없이 전체화면으로 이용하실 수 있습니다.
            </p>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    sound.playClick();
    if (currentStep < slides.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    sound.playClick();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    sound.playCompleteChime();
    localStorage.setItem('memory_tutorial_seen', 'true');
    onClose();
  };

  const slide = slides[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-[#e9e8e4] overflow-hidden flex flex-col relative animate-scale-up">
        {/* Header Indicator */}
        <div className="px-5 pt-5 pb-2 flex items-center justify-between">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fef0e3] text-[#f78f10]">
            {slide.badge}
          </span>
          <button
            type="button"
            onClick={handleComplete}
            className="text-xs font-semibold text-[#887362] hover:text-[#1b1c1a] px-2 py-1 rounded-lg transition-colors cursor-pointer"
          >
            건너뛰기
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-3 flex flex-col gap-3 min-h-[310px]">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${slide.iconBg}`}>
              <span className="material-symbols-outlined text-[26px]">{slide.icon}</span>
            </div>
            <h2 className="text-[17px] font-bold text-[#1b1c1a] leading-snug whitespace-pre-line">
              {slide.title}
            </h2>
          </div>

          <div className="mt-1 flex-1 flex flex-col justify-center">
            {slide.content}
          </div>
        </div>

        {/* Pagination Dots & Navigation Buttons */}
        <div className="px-6 pb-6 pt-2 flex flex-col gap-3 border-t border-[#efeeea] bg-[#faf9f5]/50">
          <div className="flex items-center justify-center gap-1.5 py-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  currentStep === idx ? 'w-6 bg-[#f78f10]' : 'w-2 bg-[#dbdad6]'
                }`}
                aria-label={`슬라이드 ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="py-3 px-4 rounded-2xl bg-white border border-[#dbdad6] text-[#554335] font-bold text-xs hover:bg-[#efeeea] transition-all cursor-pointer"
              >
                이전
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 rounded-2xl bg-[#f78f10] hover:bg-[#e07c08] active:scale-98 text-white font-bold text-xs shadow-md shadow-[#f78f10]/30 transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <span>{currentStep === slides.length - 1 ? '기억주머니 시작하기' : '다음'}</span>
              <span className="material-symbols-outlined text-[16px]">
                {currentStep === slides.length - 1 ? 'check' : 'arrow_forward'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
