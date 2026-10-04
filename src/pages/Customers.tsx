import { useEffect, useState, useCallback } from 'react';
import { UserPlus, Search, Phone, Users, ArrowLeft, Calendar, Camera, Frame, Receipt } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import type { Customer, Bill, EventRecord, FrameOrder, Payment } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { EmptyState, LoadingState } from '@/components/Feedback';
import { PaymentBadge, StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { logSupabaseError, getErrorToastMessage } from '@/lib/supabase-error';

export function Customers() {
  const { t } = useLanguage();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const { show } = useToast();

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').order('name').ilike('name', `%${search}%`).or(`phone.ilike.%${search}%`);
    setCustomers((data || []) as Customer[]);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const handleAdd = async () => {
    if (!newName.trim()) {
      show(t('customers.enterName' as never), 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('customers').insert({
      name: newName.trim(),
      phone: newPhone.trim(),
      notes: newNotes.trim(),
    });
    if (error) {
      const info = logSupabaseError(error, 'Add customer');
      show(getErrorToastMessage(info), 'error');
      setSaving(false);
      return;
    }
    show(t('customers.addedSuccess' as never));
    setShowAdd(false);
    setNewName('');
    setNewPhone('');
    setNewNotes('');
    setSaving(false);
    fetchCustomers();
  };

  if (selectedId) {
    return (
      <CustomerProfile
        customerId={selectedId}
        onBack={() => {
          setSelectedId(null);
          fetchCustomers();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('customers.title' as never)}</h1>
          <p className="page-subtitle">{t('customers.subtitle' as never)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <UserPlus className="w-4 h-4" />
          {t('customers.addCustomer' as never)}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 t-faint" />
        <input
          className="input pl-11"
          placeholder="Search name or phone number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : customers.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users className="w-8 h-8" />}
            title={t('customers.noCustomers' as never)}
            message={t('customers.noCustomersMsg' as never)}
            action={
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <UserPlus className="w-4 h-4" />
                {t('customers.addCustomer' as never)}
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <button
              key={customer.id}
              onClick={() => setSelectedId(customer.id)}
              className="card card-hover p-5 text-left"
            >
              <div className="flex items-start gap-3">
                <Avatar src={null} name={customer.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold t-primary truncate">{customer.name}</p>
                  <p className="text-sm t-muted">{customer.phone || 'No phone'}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t('customers.addCustomer' as never)} size="sm">
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              className="input"
              placeholder={t('customers.customerName' as never)}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Phone Number</label>
            <input
              className="input"
              placeholder={t('customers.customerPhone' as never)}
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea
              className="input"
              placeholder="Optional notes"
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button className="btn btn-secondary flex-1" onClick={() => setShowAdd(false)}>
              Cancel
            </button>
            <button className="btn btn-primary flex-1" onClick={handleAdd} disabled={saving}>
              {saving ? 'Saving...' : t('customers.addCustomer' as never)}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CustomerProfile({ customerId, onBack }: { customerId: string; onBack: () => void }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [orders, setOrders] = useState<FrameOrder[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [cust, billData, eventData, orderData, payData] = await Promise.all([
        supabase.from('customers').select('*').eq('id', customerId).maybeSingle(),
        supabase.from('bills').select('*').eq('customer_id', customerId).order('bill_date', { ascending: false }),
        supabase.from('events').select('*').eq('customer_id', customerId).order('event_date', { ascending: false }),
        supabase.from('frame_orders').select('*').eq('customer_id', customerId).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').or(`bill_id.in.(SELECT id FROM bills WHERE customer_id='${customerId}'),event_id.in.(SELECT id FROM events WHERE customer_id='${customerId}'),frame_order_id.in.(SELECT id FROM frame_orders WHERE customer_id='${customerId}')`).order('payment_date', { ascending: false }),
      ]);
      setCustomer(cust.data as Customer | null);
      setBills((billData.data || []) as Bill[]);
      setEvents((eventData.data || []) as EventRecord[]);
      setOrders((orderData.data || []) as FrameOrder[]);
      setPayments((payData.data || []) as Payment[]);
      setLoading(false);
    })();
  }, [customerId]);

  if (loading) return <LoadingState />;
  if (!customer) return <p className="t-muted">Customer not found.</p>;

  const totalBusiness =
    bills.reduce((s, b) => s + Number(b.total_amount), 0) +
    events.reduce((s, e) => s + Number(e.total_amount), 0) +
    orders.reduce((s, o) => s + Number(o.total_price), 0);
  const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = totalBusiness - totalPaid;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm t-muted hover:t-secondary">
        <ArrowLeft className="w-4 h-4" />
        Back to Customers
      </button>

      <div className="card p-6">
        <div className="flex items-start gap-4">
          <Avatar src={null} name={customer.name} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold t-primary">{customer.name}</h1>
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="flex items-center gap-2 t-muted hover:text-brand-600 dark:text-brand-400 mt-1"
              >
                <Phone className="w-4 h-4" />
                {customer.phone}
              </a>
            )}
            {customer.notes && <p className="text-sm t-muted mt-2">{customer.notes}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-4 bg-surface-subtle rounded-lg">
            <p className="text-sm t-muted">Total Business</p>
            <p className="text-lg font-bold t-primary mt-1">{formatCurrency(totalBusiness)}</p>
          </div>
          <div className="text-center p-4 bg-surface-subtle rounded-lg">
            <p className="text-sm t-muted">Paid</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="text-center p-4 bg-surface-subtle rounded-lg">
            <p className="text-sm t-muted">Pending</p>
            <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(totalPending)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="section-title flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" /> Event History
          </h2>
          {events.length === 0 ? (
            <p className="text-sm t-muted py-4 text-center">No events.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between py-2 border-b border-default last:border-0">
                  <div>
                    <p className="text-sm font-medium t-secondary">{event.event_type}</p>
                    <p className="text-xs t-muted">{formatDate(event.event_date)}</p>
                  </div>
                  <StatusBadge status={event.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="section-title flex items-center gap-2 mb-4">
            <Camera className="w-5 h-5 text-brand-600 dark:text-brand-400" /> Studio Bills
          </h2>
          {bills.length === 0 ? (
            <p className="text-sm t-muted py-4 text-center">No studio bills.</p>
          ) : (
            <div className="space-y-3">
              {bills.slice(0, 5).map((bill) => (
                <div key={bill.id} className="flex items-center justify-between py-2 border-b border-default last:border-0">
                  <div>
                    <p className="text-sm font-medium t-secondary">{bill.bill_number}</p>
                    <p className="text-xs t-muted">{formatDate(bill.bill_date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium t-secondary">{formatCurrency(Number(bill.total_amount))}</p>
                    <PaymentBadge balance={Number(bill.balance)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="section-title flex items-center gap-2 mb-4">
            <Frame className="w-5 h-5 text-brand-600 dark:text-brand-400" /> Frame/Lamination Orders
          </h2>
          {orders.length === 0 ? (
            <p className="text-sm t-muted py-4 text-center">No orders.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-default last:border-0">
                  <div>
                    <p className="text-sm font-medium t-secondary">{order.order_number}</p>
                    <p className="text-xs t-muted">{order.order_type}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="section-title flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-brand-600 dark:text-brand-400" /> Payment History
          </h2>
          {payments.length === 0 ? (
            <p className="text-sm t-muted py-4 text-center">No payments recorded.</p>
          ) : (
            <div className="space-y-3">
              {payments.slice(0, 8).map((pay) => (
                <div key={pay.id} className="flex items-center justify-between py-2 border-b border-default last:border-0">
                  <div>
                    <p className="text-sm font-medium t-secondary">{formatCurrency(Number(pay.amount))}</p>
                    <p className="text-xs t-muted">{formatDate(pay.payment_date)} · {pay.payment_method}</p>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-2 font-semibold t-primary">
                <span>Total Received</span>
                <span>{formatCurrency(payments.reduce((s, p) => s + Number(p.amount), 0))}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
