import { useState } from 'react';
import { ToastProvider } from '@/components/Toast';
import { LanguageProvider } from '@/lib/i18n';
import { AppLayout } from '@/components/AppLayout';
import type { PageKey } from '@/components/Sidebar';
import { Dashboard } from '@/pages/Dashboard';
import { Studio } from '@/pages/Studio';
import { Events } from '@/pages/Events';
import { Frames } from '@/pages/Frames';
import { Customers } from '@/pages/Customers';
import { StaffPage } from '@/pages/Staff';
import { Expenses } from '@/pages/Expenses';
import { Reports } from '@/pages/Reports';
import { SettingsPage } from '@/pages/Settings';

function App() {
  const [page, setPage] = useState<PageKey>('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Dashboard onNavigate={setPage} />;
      case 'studio':
        return <Studio />;
      case 'events':
        return <Events />;
      case 'frames':
        return <Frames />;
      case 'customers':
        return <Customers />;
      case 'staff':
        return <StaffPage />;
      case 'expenses':
        return <Expenses />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={setPage} />;
    }
  };

  return (
    <ToastProvider>
      <LanguageProvider>
        <AppLayout current={page} onNavigate={setPage}>
          {renderPage()}
        </AppLayout>
      </LanguageProvider>
    </ToastProvider>
  );
}

export default App;
