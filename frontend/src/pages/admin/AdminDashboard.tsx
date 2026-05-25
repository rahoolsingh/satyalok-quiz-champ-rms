import React, { useState } from 'react';
import { DateConfiguration } from './DateConfiguration';
import { SliderManager } from './SliderManager';
import { ResultUploader } from './ResultUploader';
import { RegistrationList } from './RegistrationList';
import { FeeConfiguration } from './FeeConfiguration';
import { EventConfiguration } from './EventConfiguration';
import { SessionManager } from './SessionManager';
import { FaqManager } from './FaqManager';
import { McqManager } from './McqManager';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import {
  Users,
  CalendarDays,
  Banknote,
  MapPin,
  Image,
  BarChart3,
  Lock,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  HelpCircle,
  ClipboardList,
} from 'lucide-react';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'registrations', label: 'Registrations', icon: <Users className="size-4" /> },
  { id: 'dates', label: 'Portal Dates', icon: <CalendarDays className="size-4" /> },
  { id: 'fees', label: 'Fees', icon: <Banknote className="size-4" /> },
  { id: 'event', label: 'Event Details', icon: <MapPin className="size-4" /> },
  { id: 'slider', label: 'Slider Images', icon: <Image className="size-4" /> },
  { id: 'results', label: 'Results', icon: <BarChart3 className="size-4" /> },
  { id: 'sessions', label: 'Sessions', icon: <Lock className="size-4" /> },
  { id: 'faq', label: 'FAQ', icon: <HelpCircle className="size-4" /> },
  { id: 'mcq', label: 'MCQs', icon: <ClipboardList className="size-4" /> },
];

type Tab = 'registrations' | 'dates' | 'fees' | 'event' | 'slider' | 'results' | 'sessions' | 'faq' | 'mcq';

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const [active, setActive] = useState<Tab>('registrations');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const username = localStorage.getItem('adminUsername') || 'Admin';

  const handleTabClick = (tab: Tab) => {
    setActive(tab);
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/30">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 border-r border-border
        transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="px-4 py-4 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <LayoutDashboard className="size-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-sm leading-tight">Quiz Champ</h2>
              <p className="text-sidebar-foreground/40 text-[10px] leading-tight">Admin Panel</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <X className="size-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2 py-3">
          <nav className="space-y-0.5">
            <p className="px-3 py-1.5 text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-wider">Navigation</p>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => handleTabClick(t.id)}
                data-active={active === t.id}
                className={`
                  flex items-center gap-2.5 w-full px-3 py-2 text-sm rounded-lg text-left transition-all
                  ${active === t.id
                    ? 'bg-accent text-accent-foreground font-medium shadow-sm'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-accent/50'
                  }
                `}
                aria-current={active === t.id ? 'page' : undefined}
              >
                {t.icon}
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </ScrollArea>

        <Separator />
        <div className="px-3 py-3 space-y-2">
          <div className="flex items-center gap-2.5 px-1">
            <Avatar className="size-7">
              <AvatarFallback className="text-[10px] bg-sidebar-accent text-sidebar-accent-foreground">
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{username}</p>
            </div>
            <ThemeSwitcher />
          </div>
          <Button variant="secondary" size="sm" onClick={onLogout} className="w-full text-xs gap-1.5">
            <LogOut className="size-3" />
            Sign Out
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-30 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
          <div className="flex items-center gap-2">
            <LayoutDashboard className="size-4 text-muted-foreground" />
            <h1 className="text-sm font-semibold">{tabs.find(t => t.id === active)?.label}</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <Button variant="ghost" size="icon-sm" onClick={onLogout} aria-label="Sign out">
              <LogOut className="size-4 text-destructive" />
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {active === 'registrations' && <RegistrationList />}
          {active === 'dates' && <DateConfiguration />}
          {active === 'fees' && <FeeConfiguration />}
          {active === 'event' && <EventConfiguration />}
          {active === 'slider' && <SliderManager />}
          {active === 'results' && <ResultUploader />}
          {active === 'sessions' && <SessionManager />}
          {active === 'faq' && <FaqManager />}
          {active === 'mcq' && <McqManager />}
        </main>
      </div>
    </div>
  );
}
