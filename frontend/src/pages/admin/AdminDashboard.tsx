import React, { useState } from 'react';
import { DateConfiguration } from './DateConfiguration';
import { SliderManager } from './SliderManager';
import { ResultUploader } from './ResultUploader';
import { RegistrationList } from './RegistrationList';

type Tab = 'registrations' | 'dates' | 'slider' | 'results';

interface AdminDashboardProps {
  onLogout: () => void;
}

export function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('registrations');
  const username = localStorage.getItem('adminUsername') || 'Admin';

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'registrations', label: 'Registrations', icon: '👥' },
    { id: 'dates', label: 'Portal Dates', icon: '📅' },
    { id: 'slider', label: 'Slider Images', icon: '🖼️' },
    { id: 'results', label: 'Results', icon: '📊' },
  ];

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <h2 style={styles.sidebarTitle}>Quiz Champ</h2>
          <p style={styles.sidebarSub}>Admin Panel</p>
        </div>
        <nav>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              style={{ ...styles.navItem, ...(activeTab === tab.id ? styles.navItemActive : {}) }}
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div style={styles.sidebarFooter}>
          <p style={styles.username}>👤 {username}</p>
          <button style={styles.logoutBtn} onClick={onLogout}>Sign Out</button>
        </div>
      </aside>

      <main style={styles.main}>
        {activeTab === 'registrations' && <RegistrationList />}
        {activeTab === 'dates' && <DateConfiguration />}
        {activeTab === 'slider' && <SliderManager />}
        {activeTab === 'results' && <ResultUploader />}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: { display: 'flex', minHeight: '100vh' },
  sidebar: { width: '240px', background: '#1a237e', color: 'white', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sidebarHeader: { padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' },
  sidebarTitle: { fontSize: '1.2rem', fontWeight: 800 },
  sidebarSub: { fontSize: '0.8rem', opacity: 0.7, marginTop: '2px' },
  navItem: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '12px 20px', background: 'none', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', cursor: 'pointer', textAlign: 'left', borderLeft: '3px solid transparent' },
  navItemActive: { background: 'rgba(255,255,255,0.15)', color: 'white', borderLeftColor: 'white' },
  sidebarFooter: { marginTop: 'auto', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' },
  username: { fontSize: '0.85rem', opacity: 0.8, marginBottom: '8px' },
  logoutBtn: { background: 'rgba(255,255,255,0.15)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', width: '100%' },
  main: { flex: 1, background: '#f8fafc', padding: '32px', overflowY: 'auto' },
};
