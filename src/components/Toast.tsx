import React from 'react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2.5 rounded-full bg-[#1b1c1a]/95 text-white text-xs font-semibold shadow-xl transition-all duration-300 pointer-events-none flex items-center gap-2 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
      <span className="material-symbols-outlined text-[16px] text-[#f78f10]">check_circle</span>
      <span>{message}</span>
    </div>
  );
};
