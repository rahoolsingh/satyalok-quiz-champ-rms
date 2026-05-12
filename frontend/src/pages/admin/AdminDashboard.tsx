import React, { useState } from 'react';
import { DateConfiguration } from './DateConfiguration';
import { SliderManager } from './SliderManager';
import { ResultUploader } from './ResultUploader';
import { RegistrationList } from './RegistrationList';
import { FeeConfiguration } from './FeeConfiguration';
import { EventConfiguration } from './EventConfiguration';

type Tab = 'registrations' | 'dates' | 'fees' | 'event' | 'slider' | 'results';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'registrations', label: 'Registrations', icon: '👥' },
  { id: 'dates', label: 'Portal Dates', icon: '📅' },
  { id: 'fees', label: 'Fees', icon: '💰' },
  { id: 'event', label: 'Event Details', icon: '📍' },
  { id: 'slider', label: 'Slider Images', icon: '🖼️' },
  { id: 'results', label: 'Results', icon: '📊' },
];

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [active, setActive] = useState<Tab>('registrations');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const username = localStorage.getItem('adminUsername') || 'Admin';

  const handleTabClick = (tab: Tab) => {
    setActive(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen relative">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#1d1d1f] text-white flex flex-col shrink-0
        transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:w-56
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-base">Quiz Champ</h2>
            <p className="text-white/50 text-xs mt-0.5">Admin Panel</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/60 hover:text-white p-1"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => handleTabClick(t.id)}
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

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-[#d2d2d7] px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 text-[#1d1d1f] hover:bg-[#f5f5f7] rounded-lg transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-sm font-bold text-[#1d1d1f]">
            {tabs.find(t => t.id === active)?.icon} {tabs.find(t => t.id === active)?.label}
          </h1>
          <button onClick={onLogout} className="text-xs text-red-500 font-medium">Logout</button>
        </header>

        {/* Page content */}
        <main className="flex-1 bg-[#f5f5f7] p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {active === 'registrations' && <RegistrationList />}
          {active === 'dates' && <DateConfiguration />}
          {active === 'fees' && <FeeConfiguration />}
          {active === 'event' && <EventConfiguration />}
          {active === 'slider' && <SliderManager />}
          {active === 'results' && <ResultUploader />}
        </main>
      </div>
    </div>
  );
}
