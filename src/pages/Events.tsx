import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  ArrowLeft,
  UserPlus,
  Trash2,
  CalendarDays,
  Users as UsersIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import type { EventRecord, EventStaff as EventStaffType, Staff, Customer, Payment, Settings } from '@/lib/types';
import { formatCurrency, formatDate, todayISO } from '@/lib/utils';
import { EVENT_TYPES, EVENT_SERVICES, EVENT_STATUSES, EVENT_STAFF_ROLES, PAYMENT_METHODS } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { EmptyState, LoadingState, ConfirmDialog } from '@/components/Feedback';
import { StatusBadge } from '@/components/StatusBadge';
import { logSupabaseError, getErrorToastMessage } from '@/lib/supabase-error';

export function Events() {
  const { t } = useLanguage();
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [showNew, setShowNew] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [eventsByDate, setEventsByDate] = useState<Record<string, number>>({});

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('events').select('*').order('event_date', { ascending: true });
    if (statusFilter !== 'all') {
      q = q.eq('status', statusFilter);
    }
    if (search) {
      q = q.or(`customer_name.ilike.%${search}%,event_type.ilike.%${search}%,location.ilike.%${search}%`);
    }
    const { data } = await q;
    setEvents((data || []) as EventRecord[]);

    const year = calendarDate.getFullYear();
    const month = String(calendarDate.getMonth() + 1).padStart(2, '0');
    const { data: calData } = await supabase
      .from('events')
      .select('event_date,status')
      .gte('event_date', `${year}-${month}-01`)
      .lte('event_date', `${year}-${month}-31`)
      .neq('status', 'Cancelled');
    const counts: Record<string, number> = {};
    (calData || []).forEach((e: Record<string, unknown>) => {
      const date = e.event_date as string;
      counts[date] = (counts[date] || 0) + 1;
    });
    setEventsByDate(counts);
    setLoading(false);
  }, [statusFilter, search, calendarDate]);

  useEffect(() => {
    const t = setTimeout(fetchEvents, 200);
    return () => clearTimeout(t);
  }, [fetchEvents]);

  if (selectedEvent) {
    return (
      <EventDetail
        event={selectedEvent}
        onBack={() => {
          setSelectedEvent(null);
          fetchEvents();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('events.title' as never)}</h1>
          <p className="page-subtitle">{t('events.subtitle' as never)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" />
          {t('events.addEvent' as never)}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 t-faint" />
          <input
            className="input pl-11"
            placeholder="Search customer, type, or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-44"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          {EVENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex gap-1 bg-surface rounded-lg border border-default p-1">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'list' ? 'bg-gradient-brand text-white shadow-sm' : 't-muted hover:bg-surface-subtle'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              view === 'calendar' ? 'bg-gradient-brand text-white shadow-sm' : 't-muted hover:bg-surface-subtle'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : view === 'calendar' ? (
        <CalendarView
          date={calendarDate}
          onPrev={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
          onNext={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
          onToday={() => setCalendarDate(new Date())}
          eventsByDate={eventsByDate}
          events={events}
          onSelectEvent={(e) => setSelectedEvent(e)}
        />
      ) : events.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Calendar className="w-8 h-8" />}
            title={t('events.noEvents' as never)}
            message="Create your first event booking to get started."
            action={
              <button className="btn btn-primary" onClick={() => setShowNew(true)}>
                <Plus className="w-4 h-4" />
                {t('events.addEvent' as never)}
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="card card-hover p-5 text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold t-primary text-lg">{event.event_type}</h3>
                  <p className="text-sm t-muted">{event.customer_name}</p>
                </div>
                <StatusBadge status={event.status} />
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="t-muted">Date</p>
                  <p className="t-secondary font-medium">{formatDate(event.event_date)}</p>
                </div>
                <div>
                  <p className="t-muted">Time</p>
                  <p className="t-secondary font-medium">
                    {event.start_time}{event.end_time && ` – ${event.end_time}`}
                  </p>
                </div>
                <div>
                  <p className="t-muted">Location</p>
                  <p className="t-secondary font-medium">{event.location || '—'}</p>
                </div>
                <div>
                  <p className="t-muted">Total</p>
                  <p className="t-secondary font-medium">{formatCurrency(Number(event.total_amount))}</p>
                </div>
              </div>
              {event.services.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {event.services.map((s) => (
                    <span key={s} className="badge badge-neutral">{s}</span>
                  ))}
                </div>
              )}
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-default">
                <div>
                  {Number(event.balance) > 0 ? (
                    <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                      Balance: {formatCurrency(Number(event.balance))}
                    </span>
                  ) : (
                    <span className="badge badge-success">PAID</span>
                  )}
                </div>
                {event.owner_approved && (
                  <span className="badge badge-info">Owner Approved</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showNew && (
        <NewEventForm
          onClose={() => setShowNew(false)}
          onSaved={() => {
            setShowNew(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
}

function CalendarView({
  date,
  onPrev,
  onNext,
  onToday,
  eventsByDate,
  events,
  onSelectEvent,
}: {
  date: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  eventsByDate: Record<string, number>;
  events: EventRecord[];
  onSelectEvent: (e: EventRecord) => void;
}) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const today = todayISO();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const dateISO = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-semibold t-primary">{monthName}</h2>
        <div className="flex gap-2">
          <button onClick={onPrev} className="btn btn-secondary btn-sm">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={onToday} className="btn btn-secondary btn-sm">
            Today
          </button>
          <button onClick={onNext} className="btn btn-secondary btn-sm">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="text-center text-xs font-semibold t-muted py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (d === null) return <div key={i} />;
          const iso = dateISO(d);
          const count = eventsByDate[iso] || 0;
          const isToday = iso === today;
          return (
            <div
              key={i}
              className={`min-h-16 rounded-lg p-1.5 border transition-colors ${
                isToday
                  ? 'border-brand-400 bg-brand-500/10'
                  : count > 0
                  ? 'border-default bg-surface-subtle'
                  : 'border-default'
              }`}
            >
              <p className={`text-xs font-medium ${isToday ? 'text-brand-700 dark:text-brand-400' : 't-muted'}`}>{d}</p>
              {count > 0 && (
                <div className="mt-1">
                  <span className={`text-xs font-semibold ${
                    count >= 8 ? 'text-red-600 dark:text-red-400' : count >= 6 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'
                  }`}>
                    {count} event{count !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-default">
        <h3 className="text-sm font-semibold t-secondary mb-3">
          Events this month ({events.filter((e) => e.event_date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length})
        </h3>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {events
            .filter((e) => e.event_date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
            .map((event) => (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event)}
                className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-surface-subtle transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                    <CalendarDays className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium t-secondary">
                      {event.event_type} — {event.customer_name}
                    </p>
                    <p className="text-xs t-muted">{formatDate(event.event_date)} · {event.start_time}</p>
                  </div>
                </div>
                <StatusBadge status={event.status} />
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}

function NewEventForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { show } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [eventCount, setEventCount] = useState(0);
  const [showCapacityWarning, setShowCapacityWarning] = useState(false);
  const [showOverrideConfirm, setShowOverrideConfirm] = useState(false);

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const [eventType, setEventType] = useState('Wedding');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [totalAmount, setTotalAmount] = useState('');
  const [advanceReceived, setAdvanceReceived] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [cust, set] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('settings').select('*').limit(1).maybeSingle(),
      ]);
      setCustomers((cust.data || []) as Customer[]);
      setSettings(set.data as Settings | null);
    })();
  }, []);

  useEffect(() => {
    if (!eventDate) {
      setEventCount(0);
      setShowCapacityWarning(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('id')
        .eq('event_date', eventDate)
        .neq('status', 'Cancelled');
      const count = (data || []).length;
      setEventCount(count);
      const max = settings?.max_events_per_day || 8;
      setShowCapacityWarning(count >= max);
    })();
  }, [eventDate, settings]);

  const filteredCustomers = customerSearch
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phone.includes(customerSearch)
      )
    : customers.slice(0, 5);

  const total = parseFloat(totalAmount) || 0;
  const advance = parseFloat(advanceReceived) || 0;
  const balance = total - advance;
  const maxEvents = settings?.max_events_per_day || 8;

  const toggleService = (svc: string) => {
    setSelectedServices((prev) =>
      prev.includes(svc) ? prev.filter((s) => s !== svc) : [...prev, svc]
    );
  };

  const handleAddCustomer = async () => {
    if (!newCustName.trim()) {
      show('Please enter the customer name.', 'error');
      return;
    }
    const { data, error } = await supabase
      .from('customers')
      .insert({ name: newCustName.trim(), phone: newCustPhone.trim() })
      .select()
      .single();
    if (error) {
      const info = logSupabaseError(error, 'Add customer (event)');
      show(getErrorToastMessage(info), 'error');
      return;
    }
    const newCust = data as Customer;
    setCustomers((prev) => [...prev, newCust]);
    setSelectedCustomer(newCust);
    setShowAddCustomer(false);
    setNewCustName('');
    setNewCustPhone('');
    show('Customer added successfully');
  };

  const handleSave = async (ownerApproved: boolean = false) => {
    if (!selectedCustomer && !newCustName.trim()) {
      show('Please select or create a customer.', 'error');
      return;
    }
    if (!eventDate) {
      show('Please select an event date.', 'error');
      return;
    }
    if (advance > total) {
      show('Advance received cannot be greater than the total amount.', 'error');
      return;
    }

    setSaving(true);
    let customerId = selectedCustomer?.id || null;
    let customerName = selectedCustomer?.name || newCustName.trim();
    let customerPhone = selectedCustomer?.phone || newCustPhone.trim();

    if (!selectedCustomer && newCustName.trim()) {
      const { data: newCust } = await supabase
        .from('customers')
        .insert({ name: newCustName.trim(), phone: newCustPhone.trim() })
        .select()
        .single();
      if (newCust) {
        customerId = (newCust as Customer).id;
        customerName = (newCust as Customer).name;
        customerPhone = (newCust as Customer).phone;
      }
    }

    const { data: eventData, error } = await supabase
      .from('events')
      .insert({
        event_type: eventType,
        customer_id: customerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        event_date: eventDate,
        start_time: startTime,
        end_time: endTime,
        location,
        services: selectedServices,
        total_amount: total,
        advance_received: advance,
        balance,
        status: ownerApproved ? 'Confirmed' : 'Booked',
        owner_approved: ownerApproved,
        notes,
      })
      .select()
      .single();

    if (error || !eventData) {
      const info = logSupabaseError(error, 'Create event');
      show(getErrorToastMessage(info), 'error');
      setSaving(false);
      return;
    }

    if (advance > 0) {
      await supabase.from('payments').insert({
        event_id: (eventData as EventRecord).id,
        amount: advance,
        payment_method: 'Cash',
        payment_date: todayISO(),
        note: 'Advance payment',
      });
    }

    show('Event booked successfully');
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm animate-fade-in" style={{ backgroundColor: "var(--overlay)" }} onClick={onClose} />
      <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-default">
          <div>
            <h2 className="text-lg font-semibold t-primary">New Event Booking</h2>
            <p className="text-sm t-muted">Book a new photography event</p>
          </div>
          <button onClick={onClose} className="t-faint hover:t-secondary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-semibold t-secondary mb-3">Customer</h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 t-faint" />
              <input
                className="input pl-10"
                placeholder="Search customer..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
            {filteredCustomers.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1 mb-2">
                {filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCustomer(c)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCustomer?.id === c.id ? 'bg-brand-500/10 text-brand-700 dark:text-brand-400' : 'hover:bg-surface-subtle t-secondary'
                    }`}
                  >
                    <span className="font-medium">{c.name}</span>
                    {c.phone && <span className="t-muted ml-2">{c.phone}</span>}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAddCustomer(true)}
              className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400 font-medium flex items-center gap-1"
            >
              <UserPlus className="w-4 h-4" /> New Customer
            </button>
            {selectedCustomer && (
              <div className="p-3 bg-brand-500/10 rounded-lg mt-2">
                <p className="text-sm font-medium text-brand-700 dark:text-brand-400">{selectedCustomer.name}</p>
                {selectedCustomer.phone && (
                  <p className="text-sm text-brand-600 dark:text-brand-400">{selectedCustomer.phone}</p>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold t-secondary mb-3">Event</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Event Type</label>
                <select className="input" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input type="date" className="input" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Start Time</label>
                <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="label">End Time</label>
                <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="label">Location</label>
                <input className="input" placeholder="Event location" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
            </div>

            {eventDate && (
              <div className={`mt-3 p-3 rounded-lg ${showCapacityWarning ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                <p className="text-sm font-medium t-secondary">
                  Event Availability — {formatDate(eventDate)}
                </p>
                <p className={`text-sm mt-1 ${showCapacityWarning ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {eventCount} / {maxEvents} events booked · {Math.max(0, maxEvents - eventCount)} slots remaining
                </p>
                {showCapacityWarning && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                    Sorry, all event slots are currently booked for this date.
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold t-secondary mb-3">Services</h3>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_SERVICES.map((svc) => (
                <label
                  key={svc}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                    selectedServices.includes(svc)
                      ? 'bg-brand-500/10 border-brand-500/30 text-brand-700 dark:text-brand-400'
                      : 'bg-surface border-default t-secondary hover:bg-surface-subtle'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(svc)}
                    onChange={() => toggleService(svc)}
                    className="accent-brand-500"
                  />
                  <span className="text-sm">{svc}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold t-secondary mb-3">Price</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Total Amount</label>
                <input type="number" min="0" className="input" placeholder="0" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} />
              </div>
              <div>
                <label className="label">Advance Received</label>
                <input type="number" min="0" className="input" placeholder="0" value={advanceReceived} onChange={(e) => setAdvanceReceived(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-between mt-3 p-3 bg-surface-subtle rounded-lg">
              <span className="text-sm t-muted">Balance</span>
              <span className={`text-sm font-semibold ${balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                {formatCurrency(balance)}
              </span>
            </div>
          </div>

          <div>
            <label className="label">Notes</label>
            <textarea className="input" rows={2} placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-default">
          <button className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
          {showCapacityWarning ? (
            <button className="btn btn-primary flex-1" onClick={() => setShowOverrideConfirm(true)} disabled={saving}>
              Book Anyway
            </button>
          ) : (
            <button className="btn btn-primary flex-1" onClick={() => handleSave(false)} disabled={saving}>
              {saving ? 'Saving...' : 'Create Booking'}
            </button>
          )}
        </div>
      </div>

      {showAddCustomer && (
        <Modal open={showAddCustomer} onClose={() => setShowAddCustomer(false)} title="New Customer" size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} placeholder="Customer name" />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} placeholder="Phone number" />
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setShowAddCustomer(false)}>Cancel</button>
              <button className="btn btn-primary flex-1" onClick={handleAddCustomer}>Add</button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={showOverrideConfirm}
        title="Override Capacity"
        message={`This date has reached the normal event capacity of ${maxEvents}. Continue with this booking?`}
        confirmLabel="Yes, Book Anyway"
        onCancel={() => setShowOverrideConfirm(false)}
        onConfirm={() => {
          setShowOverrideConfirm(false);
          handleSave(true);
        }}
      />
    </div>
  );
}

function EventDetail({ event, onBack }: { event: EventRecord; onBack: () => void }) {
  const { show } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [assignedStaff, setAssignedStaff] = useState<(EventStaffType & { staff_name: string })[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [assignStaffId, setAssignStaffId] = useState('');
  const [assignRole, setAssignRole] = useState('Photographer');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState(event.status);

  const fetchData = useCallback(async () => {
    const [staffData, esData, payData] = await Promise.all([
      supabase.from('staff').select('*').eq('status', 'Active').order('name'),
      supabase.from('event_staff').select('*').eq('event_id', event.id),
      supabase.from('payments').select('*').eq('event_id', event.id).order('payment_date', { ascending: false }),
    ]);
    const allStaff = (staffData.data || []) as Staff[];
    setStaff(allStaff);
    const esRecords = (esData.data || []) as EventStaffType[];
    const enriched = esRecords.map((es) => {
      const s = allStaff.find((st) => st.id === es.staff_id);
      return { ...es, staff_name: s?.name || 'Unknown' };
    });
    setAssignedStaff(enriched);
    setPayments((payData.data || []) as Payment[]);
    setLoading(false);
  }, [event.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalReceived = Number(event.advance_received) + payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = Number(event.total_amount) - totalReceived;

  const handleAssign = async () => {
    if (!assignStaffId) {
      show('Please select a staff member.', 'error');
      return;
    }
    const conflict = assignedStaff.find((as) => as.staff_id === assignStaffId);
    if (conflict) {
      show('This staff member is already assigned to this event.', 'error');
      return;
    }
    const { error } = await supabase.from('event_staff').insert({
      event_id: event.id,
      staff_id: assignStaffId,
      role: assignRole,
    });
    if (error) {
      const info = logSupabaseError(error, 'Assign staff to event');
      show(getErrorToastMessage(info), 'error');
      return;
    }
    show('Staff assigned successfully');
    setShowAssign(false);
    setAssignStaffId('');
    fetchData();
  };

  const handleRemoveStaff = async (id: string) => {
    await supabase.from('event_staff').delete().eq('id', id);
    show('Staff removed');
    fetchData();
  };

  const handleAddPayment = async () => {
    const amount = parseFloat(payAmount) || 0;
    if (amount <= 0) {
      show('Please enter a valid amount.', 'error');
      return;
    }
    if (amount > balance) {
      show('Payment cannot be greater than the balance due.', 'error');
      return;
    }
    const { error } = await supabase.from('payments').insert({
      event_id: event.id,
      amount,
      payment_method: payMethod,
      payment_date: todayISO(),
      note: 'Event payment',
    });
    if (error) {
      const info = logSupabaseError(error, 'Record event payment');
      show(getErrorToastMessage(info), 'error');
      return;
    }
    await supabase.from('events').update({ balance: balance - amount }).eq('id', event.id);
    show('Payment recorded');
    setShowPayment(false);
    setPayAmount('');
    fetchData();
  };

  const handleStatusChange = async (newStatus: string) => {
    await supabase.from('events').update({ status: newStatus }).eq('id', event.id);
    setStatusUpdate(newStatus);
    show('Status updated');
  };

  const handleDelete = async () => {
    await supabase.from('events').delete().eq('id', event.id);
    show('Event deleted');
    onBack();
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm t-muted hover:t-secondary">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </button>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold t-primary">
              {event.event_type} — {event.customer_name}
            </h1>
            <p className="t-muted mt-1">
              {formatDate(event.event_date)} · {event.start_time}{event.end_time && ` – ${event.end_time}`}
            </p>
            <p className="t-muted text-sm mt-1">{event.location}</p>
            {event.customer_phone && (
              <a href={`tel:${event.customer_phone}`} className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400 mt-2 text-sm">
                <Phone className="w-4 h-4" /> {event.customer_phone}
              </a>
            )}
          </div>
          <div className="flex flex-col gap-2 items-start sm:items-end">
            <StatusBadge status={statusUpdate} />
            {event.owner_approved && <span className="badge badge-info">Owner Approved</span>}
            <select
              className="input sm:w-40 text-sm"
              value={statusUpdate}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              {EVENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="section-title mb-4">Event Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="t-muted">Type</span><span className="t-secondary font-medium">{event.event_type}</span></div>
            <div className="flex justify-between"><span className="t-muted">Date</span><span className="t-secondary font-medium">{formatDate(event.event_date)}</span></div>
            <div className="flex justify-between"><span className="t-muted">Time</span><span className="t-secondary font-medium">{event.start_time}{event.end_time && ` – ${event.end_time}`}</span></div>
            <div className="flex justify-between"><span className="t-muted">Location</span><span className="t-secondary font-medium">{event.location || '—'}</span></div>
          </div>
          {event.services.length > 0 && (
            <div className="mt-4 pt-4 border-t border-default">
              <p className="text-sm t-muted mb-2">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {event.services.map((s) => <span key={s} className="badge badge-neutral">{s}</span>)}
              </div>
            </div>
          )}
          {event.notes && (
            <div className="mt-4 pt-4 border-t border-default">
              <p className="text-sm t-muted mb-1">Notes</p>
              <p className="text-sm t-secondary">{event.notes}</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">Payment Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-base">
              <span className="t-muted">Total</span>
              <span className="font-semibold t-primary">{formatCurrency(Number(event.total_amount))}</span>
            </div>
            <div className="flex justify-between">
              <span className="t-muted">Received</span>
              <span className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(totalReceived)}</span>
            </div>
            <div className="flex justify-between">
              <span className="t-muted">Balance</span>
              <span className={`font-semibold ${balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                {balance > 0 ? formatCurrency(balance) : 'PAID'}
              </span>
            </div>
          </div>

          {payments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-default space-y-2">
              <p className="text-sm t-muted">Payment History</p>
              {payments.map((pay) => (
                <div key={pay.id} className="flex justify-between text-sm">
                  <span className="t-secondary">{formatDate(pay.payment_date)} · {pay.payment_method}</span>
                  <span className="t-secondary font-medium">{formatCurrency(Number(pay.amount))}</span>
                </div>
              ))}
            </div>
          )}

          <button className="btn btn-secondary w-full mt-4" onClick={() => setShowPayment(true)}>
            <Plus className="w-4 h-4" /> Record Payment
          </button>
        </div>

        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-brand-600 dark:text-brand-400" /> Assigned Staff
            </h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAssign(true)}>
              <Plus className="w-4 h-4" /> Assign Staff
            </button>
          </div>
          {assignedStaff.length === 0 ? (
            <p className="text-sm t-muted py-4 text-center">No staff assigned yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignedStaff.map((as) => (
                <div key={as.id} className="flex items-center justify-between p-3 bg-surface-subtle rounded-lg">
                  <div>
                    <p className="text-sm font-medium t-secondary">{as.staff_name}</p>
                    <p className="text-xs t-muted">{as.role}</p>
                  </div>
                  <button onClick={() => handleRemoveStaff(as.id)} className="t-faint hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="w-4 h-4" /> Delete Event
        </button>
      </div>

      {showAssign && (
        <Modal open={showAssign} onClose={() => setShowAssign(false)} title="Assign Staff" size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">Staff Member</label>
              <select className="input" value={assignStaffId} onChange={(e) => setAssignStaffId(e.target.value)}>
                <option value="">Select staff...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} — {s.role}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Role</label>
              <input className="input" placeholder="Role" value={assignRole} onChange={(e) => setAssignRole(e.target.value)} list="event-staff-roles" />
              <datalist id="event-staff-roles">
                {EVENT_STAFF_ROLES.map((r) => <option key={r} value={r} />)}
              </datalist>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setShowAssign(false)}>Cancel</button>
              <button className="btn btn-primary flex-1" onClick={handleAssign}>Assign</button>
            </div>
          </div>
        </Modal>
      )}

      {showPayment && (
        <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment" size="sm">
          <div className="space-y-4">
            <div className="p-3 bg-surface-subtle rounded-lg text-sm">
              <div className="flex justify-between mb-1">
                <span className="t-muted">Total</span>
                <span className="t-secondary font-medium">{formatCurrency(Number(event.total_amount))}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span className="t-muted">Received</span>
                <span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(totalReceived)}</span>
              </div>
              <div className="flex justify-between">
                <span className="t-muted">Balance Due</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">{formatCurrency(balance)}</span>
              </div>
            </div>
            <div>
              <label className="label">Amount</label>
              <input type="number" min="0" max={balance} className="input" placeholder="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setShowPayment(false)}>Cancel</button>
              <button className="btn btn-primary flex-1" onClick={handleAddPayment}>Save</button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This cannot be undone."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
