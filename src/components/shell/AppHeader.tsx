'use client';

import { Globe, LogOut, Shield, Sliders } from 'lucide-react';
import type { Lang, TranslationKey } from '@/constants/translations';

interface AppHeaderProps {
  lang: Lang;
  t: (key: TranslationKey) => string;
  isAuthenticated: boolean;
  role: string | null;
  userName: string | null;
  isSidebarOpen: boolean;
  onLangChange: (lang: Lang) => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

export function AppHeader({
  lang,
  t,
  isAuthenticated,
  role,
  userName,
  isSidebarOpen,
  onLangChange,
  onLogout,
  onToggleSidebar,
}: AppHeaderProps) {
  return (
    <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-[#111a14] bg-[#070b09]/85 px-3 sm:px-6 backdrop-blur-md z-40">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <img src="/logo.png" className="h-8 sm:h-10 w-auto object-contain" alt="CareAgent" />
        <div className="min-w-0 hidden xs:block">
          <h1 className="text-xs sm:text-sm font-extrabold text-slate-200 truncate">CareAgent</h1>
          <p className="text-[9px] sm:text-[10px] text-slate-500 truncate">{t('systemName')}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1 rounded-xl bg-[#0f1712] border border-[#1c2e24] p-1" role="group" aria-label={t('systemName')}>
          <button type="button" onClick={() => onLangChange('vi')} className={`px-2 py-1 text-[10px] font-bold rounded-md ${lang === 'vi' ? 'bg-[#4d7c5d] text-white' : 'text-slate-400'}`}>VI</button>
          <button type="button" onClick={() => onLangChange('en')} className={`px-2 py-1 text-[10px] font-bold rounded-md ${lang === 'en' ? 'bg-[#4d7c5d] text-white' : 'text-slate-400'}`}>EN</button>
        </div>
        {isAuthenticated && (
          <>
            <span className="hidden md:flex items-center gap-1 text-[10px] text-[#7FB08E]">
              <Shield className="h-3 w-3" aria-hidden="true" />
              {t('e2eActive')}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-[80px] sm:max-w-none">{userName} ({role})</span>
            <button type="button" onClick={onLogout} aria-label={t('logout')} className="p-2 rounded-lg text-slate-400 hover:text-red-400">
              <LogOut className="h-4 w-4" />
            </button>
          </>
        )}
        <button type="button" onClick={onToggleSidebar} aria-expanded={isSidebarOpen} aria-label="Dev console" className="p-2 rounded-lg text-slate-500 hover:text-[#7FB08E]">
          <Sliders className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
