import { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Clock,
  Plus,
  Camera,
  Calendar,
  Frame,
  Receipt,
  UserPlus,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import type { EventRecord, FrameOrder, Settings } from '@/lib/types';
import { formatCurrency, formatDate, getGreeting, todayISO, currentMonthISO } from '@/lib/utils';
import { StatusBadge } from '@/components/StatusBadge';
import { LoadingState } from '@/components/Feedback';
import type { PageKey } from '@/components/Sidebar';

interface DashboardProps {
  onNavigate: (page: PageKey) => void;
}

interface Summary {
  todaySales: number;
  todayExpenses: number;
  monthSales: number;
  pending: number;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<Summary>({ todaySales: 0, todayExpenses: 0, monthSales: 0, pending: 0 });
  const [todayEvents, setTodayEvents] = useState<EventRecord[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<EventRecord[]>([]);
  const [pendingOrders, setPendingOrders] = useState<FrameOrder[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [eventCount, setEventCount] = useState(0);

  const fetchDashboard = useCallback(async () => {
    const today = todayISO();
    const month = currentMonthISO();

    const [billsToday, expensesToday, billsMonth, eventsToday, eventsUpcoming, frames, settingsData, eventCountData, pendingBills, pendingEvents, pendingFrames] =
      await Promise.all([
        supabase.from('bills').select('amount_received').eq('bill_date', today),
        supabase.from('expenses').select('amount').eq('expense_date', today),
        supabase.from('bills').select('amount_received, bill_date').gte('bill_date', `${month}-01`),
        supabase.from('events').select('*').eq('event_date', today).neq('status', 'Cancelled').order('start_time'),
        supabase.from('events').select('*').gt('event_date', today).neq('status', 'Cancelled').order('event_date').limit(5),
        supabase.from('frame_orders').select('*').neq('status', 'Delivered').neq('status', 'Cancelled').order('delivery_date', { ascending: true }).limit(5),
        supabase.from('settings').select('*').limit(1).maybeSingle(),
        supabase.from('events').select('id').eq('event_date', today).neq('status', 'Cancelled'),
        supabase.from('bills').select('balance').gt('balance', 0),
        supabase.from('events').select('balance').gt('balance', 0).neq('status', 'Cancelled'),
        supabase.from('frame_orders').select('balance').gt('balance', 0).neq('status', 'Cancelled'),
      ]);

    const todaySales = (billsToday.data || []).reduce((s, b: Record<string, unknown>) => s + Number(b.amount_received), 0);
    const todayExp = (expensesToday.data || []).reduce((s, e: Record<string, unknown>) => s + Number(e.amount), 0);
    const monthSales = (billsMonth.data || []).reduce((s, b: Record<string, unknown>) => s + Number(b.amount_received), 0);
    const pending =
      (pendingBills.data || []).reduce((s: number, b: Record<string, unknown>) => s + Number(b.balance), 0) +
      (pendingEvents.data || []).reduce((s: number, e: Record<string, unknown>) => s + Number(e.balance), 0) +
      (pendingFrames.data || []).reduce((s: number, f: Record<string, unknown>) => s + Number(f.balance), 0);

    setSummary({ todaySales, todayExpenses: todayExp, monthSales, pending });
    setTodayEvents((eventsToday.data || []) as EventRecord[]);
    setUpcomingEvents((eventsUpcoming.data || []) as EventRecord[]);
    setPendingOrders((frames.data || []) as FrameOrder[]);
    setSettings(settingsData.data as Settings | null);
    setEventCount((eventCountData.data || []).length);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) return <LoadingState />;

  const maxEvents = settings?.max_events_per_day || 8;
  const slotsAvailable = maxEvents - eventCount;
  const greeting = getGreeting();

  const summaryCards = [
    { label: "Today's Sales", value: formatCurrency(summary.todaySales), icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: "Today's Expenses", value: formatCurrency(summary.todayExpenses), icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'This Month', value: formatCurrency(summary.monthSales), icon: Wallet, color: 'text-brand-500', bg: 'bg-brand-500/10' },
    { label: 'Pending', value: formatCurrency(summary.pending), icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  ];

  const quickActions = [
    { label: 'New Studio Bill', icon: Camera, page: 'studio' as PageKey, primary: true },
    { label: 'New Event', icon: Calendar, page: 'events' as PageKey, primary: true },
    { label: 'New Frame Order', icon: Frame, page: 'frames' as PageKey, primary: true },
    { label: 'Add Expense', icon: Receipt, page: 'expenses' as PageKey, primary: false },
    { label: 'Add Customer', icon: UserPlus, page: 'customers' as PageKey, primary: false },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-serif text-3xl lg:text-4xl font-bold t-primary tracking-tight leading-tight">{greeting} <span className="inline-block">👋</span></h1>
        <p className="page-subtitle">{t('dashboard.welcome' as never)}</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`card card-hover p-5 animate-fade-in-up stagger-${idx + 1} relative overflow-hidden`}>
              <div className="absolute top-0 right-0 w-28 h-28 rounded-full -mr-14 -mt-14 opacity-5 dark:opacity-[0.07]" style={{ background: 'var(--accent)' }} />
              <div className="relative flex items-center gap-3 mb-3">
                <div className={`stat-icon ${card.bg} hover:scale-110`}>
                  <Icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-sm t-muted font-medium">{card.label}</p>
              </div>
              <p className="relative text-2xl font-bold t-primary animate-count-up">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Events */}
          <div className="card p-5 animate-fade-in-up stagger-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">{t('dashboard.todayEvents' as never)}</h2>
              <button onClick={() => onNavigate('events')} className="text-sm text-accent hover:text-accent-light font-medium flex items-center gap-1 transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {todayEvents.length === 0 ? (
              <p className="text-sm t-muted py-6 text-center">No events scheduled for today.</p>
            ) : (
              <div className="space-y-3">
                {todayEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between py-3 border-b-themed last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-accent-soft flex items-center justify-center flex-shrink-0">
                        <Calendar className="w-5 h-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium t-primary truncate">{event.event_type} — {event.customer_name}</p>
                        <p className="text-sm t-muted truncate">{event.location} · {event.start_time}</p>
                      </div>
                    </div>
                    <StatusBadge status={event.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="card p-5 animate-fade-in-up stagger-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">{t('dashboard.upcomingEvents' as never)}</h2>
              <button onClick={() => onNavigate('events')} className="text-sm text-accent hover:text-accent-light font-medium flex items-center gap-1 transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm t-muted py-6 text-center">No upcoming events.</p>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between py-3 border-b-themed last:border-0">
                    <div className="min-w-0">
                      <p className="font-medium t-primary truncate">{event.event_type} — {event.customer_name}</p>
                      <p className="text-sm t-muted">{formatDate(event.event_date)} · {event.location} · {event.start_time}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <StatusBadge status={event.status} />
                      {event.balance > 0 && <p className="text-sm text-amber-500 mt-1">Balance: {formatCurrency(Number(event.balance))}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Event Capacity */}
          <div className="card p-5 animate-fade-in-up stagger-5">
            <h2 className="section-title mb-4">Event Capacity</h2>
            <div className="text-center py-2">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="t-faint" />
                  <circle
                    cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - eventCount / maxEvents)}`}
                    className="text-brand-500 transition-all duration-700"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute text-xl font-bold t-primary">{eventCount}/{maxEvents}</span>
              </div>
              <p className="text-sm t-muted mt-3">
                {slotsAvailable > 0 ? `${slotsAvailable} slot${slotsAvailable !== 1 ? 's' : ''} available` : 'All slots booked'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card p-5 animate-fade-in-up stagger-6">
            <h2 className="section-title mb-4">{t('dashboard.quickActions' as never)}</h2>
            <div className="space-y-2">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => onNavigate(action.page)}
                    className={`group flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:translate-x-1 hover:shadow-sm animate-fade-in-up stagger-${idx + 1} ${
                      action.primary
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 hover:bg-brand-500/20 border border-brand-500/20'
                        : 'bg-surface-subtle t-secondary hover:bg-surface-hover border-themed'
                    }`}
                  >
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="flex-1 text-left">{action.label}</span>
                    <Plus className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pending Frame Orders */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title">Pending Frame Orders</h2>
              <button onClick={() => onNavigate('frames')} className="text-sm text-accent hover:text-accent-light font-medium transition-colors">
                View Orders
              </button>
            </div>
            {pendingOrders.length === 0 ? (
              <p className="text-sm t-muted py-4 text-center">No pending orders.</p>
            ) : (
              <div className="space-y-3">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-2 border-b-themed last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium t-primary truncate">{order.order_number}</p>
                      <p className="text-xs t-muted">{order.customer_name} · {order.order_type}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <StatusBadge status={order.status} />
                      {Number(order.balance) > 0 && <p className="text-xs text-amber-500 mt-0.5">Bal: {formatCurrency(Number(order.balance))}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
