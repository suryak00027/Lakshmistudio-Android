import { useEffect, useState, useCallback } from 'react';
import { ChartBar as BarChart3, TrendingUp, TrendingDown, Wallet, Calendar, Camera, Frame } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import { formatCurrency, formatDate, todayISO, currentMonthISO, monthName } from '@/lib/utils';
import { LoadingState } from '@/components/Feedback';

type Period = 'today' | 'month' | 'custom';

interface ReportData {
  studioSales: number;
  eventSales: number;
  frameSales: number;
  totalSales: number;
  expenses: number;
  pending: number;
  profit: number;
  eventCount: number;
  billCount: number;
  orderCount: number;
}

export function Reports() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<Period>('month');
  const [startDate, setStartDate] = useState(todayISO());
  const [endDate, setEndDate] = useState(todayISO());
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReportData>({
    studioSales: 0,
    eventSales: 0,
    frameSales: 0,
    totalSales: 0,
    expenses: 0,
    pending: 0,
    profit: 0,
    eventCount: 0,
    billCount: 0,
    orderCount: 0,
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);

    let dateStart: string;
    let dateEnd: string;

    if (period === 'today') {
      dateStart = todayISO();
      dateEnd = todayISO();
    } else if (period === 'month') {
      const month = currentMonthISO();
      dateStart = `${month}-01`;
      const [y, m] = month.split('-').map(Number);
      dateEnd = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`;
    } else {
      dateStart = startDate;
      dateEnd = endDate;
    }

    const [payments, events, orders, expenses, pendingBills, pendingEvents, pendingOrders] = await Promise.all([
      supabase.from('payments').select('amount,payment_date,bill_id,event_id,frame_order_id').gte('payment_date', dateStart).lte('payment_date', dateEnd),
      supabase.from('events').select('total_amount,event_date,status').gte('event_date', dateStart).lte('event_date', dateEnd),
      supabase.from('frame_orders').select('total_price,created_at,status').gte('created_at', `${dateStart}T00:00:00`).lte('created_at', `${dateEnd}T23:59:59`),
      supabase.from('expenses').select('amount,expense_date').gte('expense_date', dateStart).lte('expense_date', dateEnd),
      supabase.from('bills').select('balance').gt('balance', 0),
      supabase.from('events').select('balance').gt('balance', 0).neq('status', 'Cancelled'),
      supabase.from('frame_orders').select('balance').gt('balance', 0).neq('status', 'Cancelled'),
    ]);

    const allPayments = (payments.data || []) as Record<string, unknown>[];
    const studioSales = allPayments.filter((p) => p.bill_id).reduce((s, p) => s + Number(p.amount), 0);
    const eventSales = allPayments.filter((p) => p.event_id).reduce((s, p) => s + Number(p.amount), 0);
    const frameSales = allPayments.filter((p) => p.frame_order_id).reduce((s, p) => s + Number(p.amount), 0);
    const totalSales = allPayments.reduce((s, p) => s + Number(p.amount), 0);
    const totalExpenses = (expenses.data || []).reduce((s: number, e: Record<string, unknown>) => s + Number(e.amount), 0);
    const pending =
      (pendingBills.data || []).reduce((s: number, b: Record<string, unknown>) => s + Number(b.balance), 0) +
      (pendingEvents.data || []).reduce((s: number, e: Record<string, unknown>) => s + Number(e.balance), 0) +
      (pendingOrders.data || []).reduce((s: number, o: Record<string, unknown>) => s + Number(o.balance), 0);

    const eventCount = (events.data || []).filter((e: Record<string, unknown>) => e.status !== 'Cancelled').length;
    const orderCount = (orders.data || []).filter((o: Record<string, unknown>) => o.status !== 'Cancelled').length;

    setData({
      studioSales,
      eventSales,
      frameSales,
      totalSales,
      expenses: totalExpenses,
      pending,
      profit: totalSales - totalExpenses,
      eventCount,
      billCount: (payments.data || []).filter((p: Record<string, unknown>) => p.bill_id).length,
      orderCount,
    });
    setLoading(false);
  }, [period, startDate, endDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'month', label: 'This Month' },
    { key: 'custom', label: 'Custom Date' },
  ];

  const reportTitle =
    period === 'today' ? formatDate(todayISO()) :
    period === 'month' ? monthName(currentMonthISO()) :
    `${formatDate(startDate)} — ${formatDate(endDate)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('reports.title' as never)}</h1>
        <p className="page-subtitle">{t('reports.subtitle' as never)}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="flex gap-1 bg-surface rounded-lg border border-default p-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p.key ? 'bg-gradient-brand text-white shadow-sm' : 't-muted hover:bg-surface-subtle'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <span className="t-muted">to</span>
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        )}
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <div className="card p-6 bg-brand-500/5 border-brand-200">
            <p className="text-sm t-muted">{reportTitle}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-sm t-muted">Money Received</p>
                <p className="text-2xl font-bold t-primary mt-1">{formatCurrency(data.totalSales)}</p>
              </div>
              <div>
                <p className="text-sm t-muted">Expenses</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{formatCurrency(data.expenses)}</p>
              </div>
              <div>
                <p className="text-sm t-muted">Approximate Profit</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(data.profit)}</p>
              </div>
              <div>
                <p className="text-sm t-muted">Pending</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(data.pending)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="section-title mb-4">Sales by Category</h2>
              <div className="space-y-4">
                <CategoryRow icon={Camera} label="Studio" amount={data.studioSales} count={data.billCount} />
                <CategoryRow icon={Calendar} label="Events" amount={data.eventSales} count={data.eventCount} />
                <CategoryRow icon={Frame} label="Frames & Lamination" amount={data.frameSales} count={data.orderCount} />
              </div>
            </div>

            <div className="card p-5">
              <h2 className="section-title mb-4">Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-default">
                  <span className="t-muted flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" /> Total Money Received
                  </span>
                  <span className="font-semibold t-primary">{formatCurrency(data.totalSales)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-default">
                  <span className="t-muted flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" /> Total Expenses
                  </span>
                  <span className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(data.expenses)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-default">
                  <span className="t-muted flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Customer Balances
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{formatCurrency(data.pending)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="t-muted flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-brand-600 dark:text-brand-400" /> Approximate Profit
                  </span>
                  <span className={`font-bold text-base ${data.profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {formatCurrency(data.profit)}
                  </span>
                </div>
              </div>
              <p className="text-xs t-faint mt-4">
                * Profit is approximate. This is a simple business tracker, not formal accounting software.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CategoryRow({
  icon: Icon,
  label,
  amount,
  count,
}: {
  icon: typeof Camera;
  label: string;
  amount: number;
  count: number;
}) {
  return (
    <div className="flex items-center justify-between p-3 bg-surface-subtle rounded-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <p className="text-sm font-medium t-secondary">{label}</p>
          <p className="text-xs t-muted">{count} record{count !== 1 ? 's' : ''}</p>
        </div>
      </div>
      <p className="font-semibold t-primary">{formatCurrency(amount)}</p>
    </div>
  );
}
