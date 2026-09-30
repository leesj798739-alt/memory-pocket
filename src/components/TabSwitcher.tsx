import React from 'react';
import { TabType } from '../types';

interface TabSwitcherProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  notifCount: number;
  archiveCount: number;
}

export const TabSwitcher: React.FC<TabSwitcherProps> = ({
  activeTab,
  onTabChange,
  notifCount,
  archiveCount,
}) => {
  return (
    <div className="px-4 pt-2 pb-2">
      <div className="bg-[#efeeea] rounded-2xl flex items-center p-1.5 shadow-inner border border-[#dbc2ae]/30">
        {/* Tab 1: 알림 */}
        <button
          type="button"
          onClick={() => onTabChange('notification')}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
            activeTab === 'notification'
              ? 'bg-white text-[#f78f10] font-bold shadow-sm'
              : 'text-[#6b5c44] hover:text-[#1b1c1a] font-semibold'
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px] leading-none"
            style={{
              fontVariationSettings: activeTab === 'notification' ? "'FILL' 1" : "'FILL' 0",
              color: activeTab === 'notification' ? '#f78f10' : '#6b5c44',
            }}
          >
            notifications
          </span>
          <span className="tracking-tight leading-none text-[15px]">알림</span>
          <span
            className={`ml-1 px-2 py-0.5 font-bold text-[11px] rounded-full leading-none transition-colors ${
              activeTab === 'notification'
                ? 'bg-[#fef0e3] text-[#f78f10]'
                : 'bg-[#e9e8e4] text-[#6b5c44]'
            }`}
          >
            {notifCount}
          </span>
        </button>

        {/* Tab 2: 보관 */}
        <button
          type="button"
          onClick={() => onTabChange('archive')}
          className={`flex-1 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
            activeTab === 'archive'
              ? 'bg-white text-[#6b5c44] font-bold shadow-sm'
              : 'text-[#6b5c44] hover:text-[#1b1c1a] font-semibold'
          }`}
        >
          <span
            className="material-symbols-outlined text-[20px] leading-none text-[#6b5c44]"
            style={{
              fontVariationSettings: activeTab === 'archive' ? "'FILL' 1" : "'FILL' 0",
            }}
          >
            inventory_2
          </span>
          <span className="tracking-tight leading-none text-[15px]">보관</span>
          <span
            className={`ml-1 px-2 py-0.5 font-bold text-[11px] rounded-full leading-none transition-colors ${
              activeTab === 'archive'
                ? 'bg-[#f2ddbe] text-[#706048]'
                : 'bg-[#e9e8e4] text-[#6b5c44]'
            }`}
          >
            {archiveCount}
          </span>
        </button>
      </div>
    </div>
  );
};
