import React, { useState } from 'react';
import { DateConfiguration } from './DateConfiguration';
import { SliderManager } from './SliderManager';
import { ResultUploader } from './ResultUploader';
import { RegistrationList } from './RegistrationList';
import { FeeConfiguration } from './FeeConfiguration';
import { EventConfiguration } from './EventConfiguration';
import { SessionManager } from './SessionManager';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

type Tab = 'registrations' | 'dates' | 'fees' | 'event' | 'slider' | 'results' | 'sessions';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'registrations', label: 'Registrations', icon: '👥' },
  { id: 'dates', label: 'Portal Dates', icon: '📅' },
  { id: 'fees', label: 'Fees', icon: '💰' },
  { id: 'event', label: 'Event Details', icon: '📍' },
  { id: 'slider', label: 'Slider Images', icon: '🖼️' },
  { id: 'results', label: 'Results', icon: '📊' },
  { id: 'sessions', label: 'Sessions', icon: '🔐' },
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
    <div className="flex h-dvh overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 border-r border-border
        transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:w-56
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-5 py-5 flex items-center justify-between border-b border-border">
          <div>
            <h2 className="font-bold text-base text-sidebar-foreground">Quiz Champ</h2>
            <p className="text-sidebar-foreground/50 text-xs mt-0.5">Admin Panel</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="py-2">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => handleTabClick(t.id)}
                className={`flex items-center gap-2.5 w-full px-5 py-2.5 text-sm text-left transition-colors
                  ${active === t.id
                    ? 'bg-accent text-accent-foreground border-l-2 border-primary'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-accent/50 border-l-2 border-transparent'
                  }`}
                aria-current={active === t.id ? 'page' : undefined}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </ScrollArea>

        <Separator />
        <div className="px-5 py-4 space-y-2">
          <p className="text-sidebar-foreground/50 text-xs">👤 {username}</p>
          <Button variant="secondary" size="sm" onClick={onLogout} className="w-full text-xs">
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          <h1 className="text-sm font-bold">
            {tabs.find(t => t.id === active)?.icon} {tabs.find(t => t.id === active)?.label}
          </h1>
          <Button variant="link" size="sm" onClick={onLogout} className="text-destructive">Logout</Button>
        </header>

        <main className="flex-1 bg-muted/30 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {active === 'registrations' && <RegistrationList />}
          {active === 'dates' && <DateConfiguration />}
          {active === 'fees' && <FeeConfiguration />}
          {active === 'event' && <EventConfiguration />}
          {active === 'slider' && <SliderManager />}
          {active === 'results' && <ResultUploader />}
          {active === 'sessions' && <SessionManager />}
        </main>
      </div>
    </div>
  );
}
