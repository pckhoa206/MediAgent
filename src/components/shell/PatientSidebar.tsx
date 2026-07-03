'use client';

import { Activity, Calendar, User } from 'lucide-react';
import type { Lang, TranslationKey } from '@/constants/translations';

type PatientTab = 'chatbot' | 'booking' | 'profile';

interface PatientSidebarProps {
  lang: Lang;
  t: (key: TranslationKey) => string;
  activeTab: PatientTab;
  patientHeight: string;
  patientWeight: string;
  patientBmi: number | null;
  onTabChange: (tab: PatientTab) => void;
}

export function PatientSidebar({
  t,
  activeTab,
  patientHeight,
  patientWeight,
  patientBmi,
  onTabChange,
}: PatientSidebarProps) {
  const tabs: { id: PatientTab; icon: typeof Activity; label: string }[] = [
    { id: 'chatbot', icon: Activity, label: t('chatTab') },
    { id: 'booking', icon: Calendar, label: t('bookingTab') },
    { id: 'profile', icon: User, label: t('profileTab') },
  ];

  return (
    <nav className="w-full sm:w-56 lg:w-64 border-b sm:border-b-0 sm:border-r border-[#111a14] bg-[#070b09] p-3 sm:p-4 space-y-1 shrink-0" aria-label={t('menuTitle')}>
      <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase">{t('menuTitle')}</div>
      {tabs.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => onTabChange(id)}
          aria-current={activeTab === id ? 'page' : undefined}
          className={`w-full flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:py-3 rounded-xl text-xs font-bold border transition-all ${
            activeTab === id
              ? 'bg-[#14231b]/40 border-[#4d7c5d]/20 text-[#7FB08E]'
              : 'text-slate-400 border-transparent hover:bg-[#0f1712]'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </button>
      ))}
      <div className="pt-4 mt-2 border-t border-[#1c2e24] px-2 space-y-1 text-[10px]">
        <div className="font-bold text-slate-500 uppercase">{t('biometricsTitle')}</div>
        <div className="flex justify-between"><span className="text-slate-500">{t('heightText')}</span><span>{patientHeight} cm</span></div>
        <div className="flex justify-between"><span className="text-slate-500">{t('weightText')}</span><span>{patientWeight} kg</span></div>
        <div className="flex justify-between"><span className="text-slate-500">{t('bmiText')}</span><span className="text-[#7FB08E]">{patientBmi}</span></div>
      </div>
    </nav>
  );
}
