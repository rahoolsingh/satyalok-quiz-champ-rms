import React, { useState } from 'react';
import { DateConfiguration } from './DateConfiguration';
import { SliderManager } from './SliderManager';
import { ResultUploader } from './ResultUploader';
import { RegistrationList } from './RegistrationList';
import { FeeConfiguration } from './FeeConfiguration';

type Tab = 'registrations' | 'dates' | 'fees' | 'slider' | 'results';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'registrations', label: 'Registrations', icon: '👥' },
  { id: 'dates', label: 'Portal Dates', icon: '📅' },
  { id: 'fees', label: 'Fees', icon: '💰' },
  { id: 'slider', label: 'Slider Images', icon: '🖼️' },
  { id: 'results', label: 'Results', icon: '📊' },
];

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [active, setActive] = useState<Tab>('registrations');
  const username = localStorage.getItem('adminUsername') || 'Admin';

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1d1d1f] text-white flex flex-col shrink-0">
        <div className="px-5 py-6 border-b border-white/10">
          <h2 className="font-bold text-base">Quiz Champ</h2>
          <p className="text-white/50 text-xs mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 py-2">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={`flex items-center gap-2.5 w-full px-5 py-3 text-sm text-left transition-colors
                ${active === t.id ? 'bg-white/10 text-white border-l-2 border-white' : 'text-white/60 hover:text-white hover:bg-white/5 border-l-2 border-transparent'}`}
              aria-current={active === t.id ? 'page' : undefined}>
              <span>{t.icon}</span><span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-white/50 text-xs mb-2">👤 {username}</p>
          <button onClick={onLogout} className="w-full py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded-lg transition-colors">Sign Out</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 bg-[#f5f5f7] p-8 overflow-y-auto">
        {active === 'registrations' && <RegistrationList />}
        {active === 'dates' && <DateConfiguration />}
        {active === 'fees' && <FeeConfiguration />}
        {active === 'slider' && <SliderManager />}
        {active === 'results' && <ResultUploader />}
      </main>
    </div>
  );
}
