import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Menu, Phone, Sun, Moon, Languages } from 'lucide-react';
import { Sidebar, type PageKey } from './Sidebar';
import { useSettings } from '@/lib/hooks';
import { useTheme } from '@/lib/theme';
import { useLanguage } from '@/lib/i18n';
import { StudioLogo } from '@/components/Avatar';
import { supabase } from '@/lib/supabase';
import type { Settings } from '@/lib/types';

interface AppLayoutProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

export function AppLayout({ current, onNavigate, children }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings: hookSettings, refetchSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState<Settings | null>(null);
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang } = useLanguage();

  const fetchLocalSettings = useCallback(async () => {
    const { data } = await supabase.from('settings').select('*').limit(1).maybeSingle();
    setLocalSettings(data as Settings | null);
  }, []);

  useEffect(() => {
    fetchLocalSettings();
    const handler = () => {
      fetchLocalSettings();
      refetchSettings();
    };
    window.addEventListener('settings-updated', handler);
    return () => window.removeEventListener('settings-updated', handler);
  }, [fetchLocalSettings, refetchSettings]);

  const settings = localSettings || hookSettings;

  return (
    <div className="flex min-h-screen transition-colors duration-300" style={{ backgroundColor: 'var(--bg-app)' }}>
      <Sidebar
        current={current}
        onNavigate={onNavigate}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 glass px-4 py-3 flex items-center gap-3">
          <button onClick={() => setMobileOpen(true)} className="t-secondary transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            <StudioLogo src={settings?.logo_url || null} size="sm" />
            <div>
              <span className="font-serif text-xl font-bold t-primary tracking-widest">LAKSHMI STUDIO</span>
              <span className="text-xs t-muted ml-2">{settings?.tagline || 'since 1999'}</span>
            </div>
          </div>
          <button onClick={toggleLang} className="t-muted hover:t-secondary transition-colors" title="Language">
            <Languages className="w-5 h-5" />
          </button>
          <button onClick={toggle} className="t-muted hover:t-secondary transition-colors">
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          {settings && (
            <a href={`tel:${settings.phone}`} className="text-accent hover:text-accent-light transition-colors">
              <Phone className="w-5 h-5" />
            </a>
          )}
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex sticky top-0 z-20 glass px-8 h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            {settings?.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="flex items-center gap-2 text-sm t-muted hover:text-accent transition-colors"
              >
                <Phone className="w-4 h-4" />
                {settings.phone}
              </a>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="w-9 h-9 rounded-lg flex items-center justify-center t-muted hover:t-primary hover:bg-surface-subtle transition-all duration-200 active:scale-90"
              title={lang === 'en' ? 'தமிழ்' : 'English'}
            >
              <Languages className="w-5 h-5" />
            </button>
            <button
              onClick={toggle}
              className="w-9 h-9 rounded-lg flex items-center justify-center t-muted hover:t-primary hover:bg-surface-subtle transition-all duration-200 active:scale-90"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
          <div key={current} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
