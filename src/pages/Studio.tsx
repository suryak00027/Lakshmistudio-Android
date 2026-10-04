import { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Search,
  Camera,
  Printer,
  FileText,
  X,
  Trash2,
  UserPlus,
  Phone,
  CheckCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import type { Bill, BillItem, Customer, Service, Settings } from '@/lib/types';
import { formatCurrency, formatDate, todayISO, generateBillNumber } from '@/lib/utils';
import { PAYMENT_METHODS } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { EmptyState, LoadingState } from '@/components/Feedback';
import { PaymentBadge } from '@/components/StatusBadge';
import { logSupabaseError, getErrorToastMessage } from '@/lib/supabase-error';

type FilterKey = 'today' | 'week' | 'month';

export function Studio() {
  const { t } = useLanguage();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterKey>('today');
  const [showNewBill, setShowNewBill] = useState(false);
  const [receiptBill, setReceiptBill] = useState<{ bill: Bill; items: BillItem[] } | null>(null);

  const fetchBills = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('bills').select('*').order('created_at', { ascending: false });
    const today = todayISO();
    if (filter === 'today') {
      q = q.eq('bill_date', today);
    } else if (filter === 'week') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      q = q.gte('bill_date', d.toISOString().split('T')[0]);
    } else if (filter === 'month') {
      q = q.gte('bill_date', `${today.substring(0, 8)}01`);
    }
    if (search) {
      q = q.or(`customer_name.ilike.%${search}%,bill_number.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }
    const { data } = await q;
    setBills((data || []) as Bill[]);
    setLoading(false);
  }, [filter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchBills, 200);
    return () => clearTimeout(timer);
  }, [fetchBills]);

  const handleBillSaved = (bill: Bill, items: BillItem[]) => {
    setShowNewBill(false);
    setReceiptBill({ bill, items });
    fetchBills();
  };

  const filters: { key: FilterKey; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('studio.title' as never)}</h1>
          <p className="page-subtitle">{t('studio.subtitle' as never)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewBill(true)}>
          <Plus className="w-4 h-4" />
          {t('studio.newBill' as never)}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 t-faint" />
          <input
            className="input pl-11"
            placeholder="Search customer, phone, or bill number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 bg-surface rounded-lg border border-default p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-gradient-brand text-white shadow-sm'
                  : 't-muted hover:bg-surface-subtle'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : bills.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Camera className="w-8 h-8" />}
            title="No bills yet"
            message="Create your first studio bill to start recording sales."
            action={
              <button className="btn btn-primary" onClick={() => setShowNewBill(true)}>
                <Plus className="w-4 h-4" />
                {t('studio.newBill' as never)}
              </button>
            }
          />
        </div>
      ) : (
        <div className="card divide-y divide-themed">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="flex items-center justify-between p-4 hover:bg-surface-subtle transition-colors cursor-pointer"
              onClick={async () => {
                const { data } = await supabase.from('bill_items').select('*').eq('bill_id', bill.id);
                setReceiptBill({ bill, items: (data || []) as BillItem[] });
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
                  <Camera className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium t-primary truncate">
                    {bill.bill_number} — {bill.customer_name}
                  </p>
                  <p className="text-sm t-muted">
                    {formatDate(bill.bill_date)} · {bill.customer_phone || 'No phone'}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="font-semibold t-primary">{formatCurrency(Number(bill.total_amount))}</p>
                <PaymentBadge balance={Number(bill.balance)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {showNewBill && (
        <NewBillForm onClose={() => setShowNewBill(false)} onSaved={handleBillSaved} />
      )}

      {receiptBill && (
        <ReceiptModal
          bill={receiptBill.bill}
          items={receiptBill.items}
          onClose={() => setReceiptBill(null)}
          onPrint={() => window.print()}
        />
      )}
    </div>
  );
}

function NewBillForm({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (bill: Bill, items: BillItem[]) => void;
}) {
  const { show } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [existingBillNumbers, setExistingBillNumbers] = useState<string[]>([]);

  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [walkIn, setWalkIn] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);

  const [items, setItems] = useState<BillItem[]>([]);
  const [selectedService, setSelectedService] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [saving, setSaving] = useState(false);

  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  useEffect(() => {
    (async () => {
      const [cust, svc, , bills] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('services').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('settings').select('*').limit(1).maybeSingle(),
        supabase.from('bills').select('bill_number'),
      ]);
      setCustomers((cust.data || []) as Customer[]);
      setServices((svc.data || []) as Service[]);
      setExistingBillNumbers((bills.data || []).map((b: Record<string, unknown>) => b.bill_number as string));
    })();
  }, []);

  const filteredCustomers = customerSearch
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
          c.phone.includes(customerSearch)
      )
    : customers.slice(0, 5);

  const total = items.reduce((s, i) => s + Number(i.total), 0);
  const received = parseFloat(amountReceived) || 0;
  const balance = total - received;

  const addService = (serviceId: string) => {
    const svc = services.find((s) => s.id === serviceId);
    if (!svc) return;
    const itemTotal = Number(svc.price) * 1 - 0;
    const newItem: BillItem = {
      id: `temp-${Date.now()}`,
      bill_id: '',
      service_name: svc.name,
      variant: svc.variant,
      quantity: 1,
      price: Number(svc.price),
      discount: 0,
      total: itemTotal,
      created_at: '',
    };
    setItems((prev) => [...prev, newItem]);
    setSelectedService('');
  };

  const updateItem = (id: string, field: keyof BillItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'price' || field === 'quantity' || field === 'discount') {
          updated.total =
            Number(updated.price) * Number(updated.quantity) - Number(updated.discount);
        }
        return updated;
      })
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
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
      const info = logSupabaseError(error, 'Add customer (studio bill)');
      show(getErrorToastMessage(info), 'error');
      return;
    }
    const newCust = data as Customer;
    setCustomers((prev) => [...prev, newCust]);
    setSelectedCustomer(newCust);
    setWalkIn(false);
    setShowAddCustomer(false);
    setNewCustName('');
    setNewCustPhone('');
    show('Customer added successfully');
  };

  const handleSave = async () => {
    if (items.length === 0) {
      show('Please add at least one service to the bill.', 'error');
      return;
    }
    if (received > total) {
      show('Amount received cannot be greater than the total amount.', 'error');
      return;
    }
    if (received < 0) {
      show('Amount received cannot be negative.', 'error');
      return;
    }

    setSaving(true);
    const billNumber = generateBillNumber(existingBillNumbers);
    const customerName = walkIn ? 'Walk-in Customer' : selectedCustomer?.name || 'Walk-in Customer';
    const customerPhone = walkIn ? '' : selectedCustomer?.phone || '';

    const itemsJson = items.map((i) => ({
      service_name: i.service_name,
      variant: i.variant,
      quantity: i.quantity,
      price: i.price,
      discount: i.discount,
      total: i.total,
    }));

    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('create_bill_with_items', {
        p_bill_number: billNumber,
        p_customer_id: walkIn ? null : selectedCustomer?.id || null,
        p_customer_name: customerName,
        p_customer_phone: customerPhone,
        p_total_amount: total,
        p_amount_received: received,
        p_balance: balance,
        p_payment_method: paymentMethod,
        p_bill_date: todayISO(),
        p_items: itemsJson,
      });

    if (rpcError || !rpcResult?.bill_id) {
      const info = logSupabaseError(rpcError, 'Create bill (RPC)');
      show(getErrorToastMessage(info), 'error');
      setSaving(false);
      return;
    }

    const { data: savedBillData } = await supabase
      .from('bills')
      .select('*')
      .eq('id', rpcResult.bill_id)
      .single();
    const savedBill = savedBillData as Bill;
    const { data: savedItems } = await supabase
      .from('bill_items')
      .select('*')
      .eq('bill_id', rpcResult.bill_id);
    show('Bill saved successfully');
    setSaving(false);
    onSaved(savedBill, (savedItems || []) as BillItem[]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm animate-fade-in" style={{ backgroundColor: "var(--overlay)" }} onClick={onClose} />
      <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-default">
          <div>
            <h2 className="text-lg font-semibold t-primary">New Studio Bill</h2>
            <p className="text-sm t-muted">Create a new bill for photography services</p>
          </div>
          <button onClick={onClose} className="t-faint hover:t-secondary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            <div className="p-6 border-r border-default">
              <h3 className="text-sm font-semibold t-secondary mb-4">Customer</h3>

              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setWalkIn(true)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    walkIn ? 'bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/30' : 'bg-surface-subtle t-muted border border-default'
                  }`}
                >
                  Walk-in Customer
                </button>
                <button
                  onClick={() => setWalkIn(false)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !walkIn ? 'bg-brand-500/10 text-brand-700 dark:text-brand-400 border border-brand-500/30' : 'bg-surface-subtle t-muted border border-default'
                  }`}
                >
                  Existing Customer
                </button>
              </div>

              {!walkIn && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 t-faint" />
                    <input
                      className="input pl-10"
                      placeholder="Search customer..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {filteredCustomers.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCustomer(c)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedCustomer?.id === c.id
                            ? 'bg-brand-500/10 text-brand-700 dark:text-brand-400'
                            : 'hover:bg-surface-subtle t-secondary'
                        }`}
                      >
                        <span className="font-medium">{c.name}</span>
                        {c.phone && <span className="t-muted ml-2">{c.phone}</span>}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAddCustomer(true)}
                    className="text-sm text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400 font-medium flex items-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    New Customer
                  </button>
                  {selectedCustomer && (
                    <div className="p-3 bg-brand-500/10 rounded-lg">
                      <p className="text-sm font-medium text-brand-700 dark:text-brand-400">{selectedCustomer.name}</p>
                      {selectedCustomer.phone && (
                        <a href={`tel:${selectedCustomer.phone}`} className="text-sm text-brand-600 dark:text-brand-400 flex items-center gap-1 mt-1">
                          <Phone className="w-3 h-3" /> {selectedCustomer.phone}
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {walkIn && (
                <div className="p-4 bg-surface-subtle rounded-lg">
                  <p className="text-sm t-muted">Walk-in Customer</p>
                  <p className="text-xs t-muted mt-1">No customer record will be created.</p>
                </div>
              )}

              <h3 className="text-sm font-semibold t-secondary mb-3 mt-6">Select Service</h3>
              <select
                className="input mb-3"
                value={selectedService}
                onChange={(e) => addService(e.target.value)}
              >
                <option value="">Choose a service to add...</option>
                {services.map((svc) => (
                  <option key={svc.id} value={svc.id}>
                    {svc.name}
                    {svc.variant ? ` — ${svc.variant}` : ''}
                    {Number(svc.price) > 0 ? ` — ${formatCurrency(Number(svc.price))}` : ' — Custom price'}
                  </option>
                ))}
              </select>

              {items.length > 0 && (
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="p-3 bg-surface-subtle rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium t-secondary">
                          {item.service_name}
                          {item.variant && ` — ${item.variant}`}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="t-faint hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs t-muted">Qty</label>
                          <input
                            type="number"
                            min="1"
                            className="input py-1.5 text-sm"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        <div>
                          <label className="text-xs t-muted">Price</label>
                          <input
                            type="number"
                            min="0"
                            className="input py-1.5 text-sm"
                            value={item.price}
                            onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        <div>
                          <label className="text-xs t-muted">Discount</label>
                          <input
                            type="number"
                            min="0"
                            className="input py-1.5 text-sm"
                            value={item.discount}
                            onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                      <p className="text-sm font-semibold t-secondary text-right">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-surface-subtle">
              <h3 className="text-sm font-semibold t-secondary mb-4">Bill Summary</h3>

              <div className="card p-4 bg-surface mb-4">
                {items.length === 0 ? (
                  <p className="text-sm t-muted text-center py-6">
                    No services added yet.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="t-secondary">
                          {item.service_name}
                          {item.variant && ` (${item.variant})`}
                          {item.quantity > 1 && ` ×${item.quantity}`}
                        </span>
                        <span className="t-secondary font-medium">{formatCurrency(item.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-base font-semibold t-primary">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>

                <div>
                  <label className="label">Amount Received</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    placeholder="0"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                  />
                </div>

                <div className="flex justify-between text-sm">
                  <span className="t-muted">Balance</span>
                  <span className={`font-semibold ${balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                    {formatCurrency(balance)}
                  </span>
                </div>

                <div>
                  <label className="label">Payment Method</label>
                  <select
                    className="input"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                className="btn btn-primary w-full mt-6"
                onClick={handleSave}
                disabled={saving || items.length === 0}
              >
                {saving ? 'Saving...' : 'Save Bill'}
              </button>
            </div>
          </div>
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
    </div>
  );
}

function ReceiptModal({
  bill,
  items,
  onClose,
  onPrint,
}: {
  bill: Bill;
  items: BillItem[];
  onClose: () => void;
  onPrint: () => void;
}) {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    supabase.from('settings').select('*').limit(1).maybeSingle().then(({ data }) => {
      setSettings(data as Settings | null);
    });
  }, []);

  const printRef = (el: HTMLDivElement | null) => {
    if (el) el.id = 'print-receipt';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm animate-fade-in no-print" onClick={onClose} />
      <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-default no-print">
          <h2 className="text-lg font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> Bill Saved Successfully
          </h2>
          <button onClick={onClose} className="t-faint hover:t-secondary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <div ref={printRef} className="bg-surface">
            {/* Receipt Header */}
            <div className="text-center mb-5 pb-4 border-b-2 border-brand-500/30">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Logo"
                  className="w-16 h-16 rounded-xl object-cover mx-auto mb-2 ring-1 ring-white/15"
                />
              ) : null}
              <h1 className="font-serif text-2xl font-bold t-primary tracking-wide">
                {settings?.business_name || 'LAKSHMI STUDIO'}
              </h1>
              <p className="text-xs text-brand-600 dark:text-brand-400 tracking-widest uppercase mt-1">
                {settings?.tagline || 'since 1999'}
              </p>
              {settings?.phone && (
                <p className="text-sm t-muted mt-1.5 flex items-center justify-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> {settings.phone}
                </p>
              )}
              {settings?.address && (
                <p className="text-xs t-muted mt-1">{settings.address}</p>
              )}
            </div>

            {/* Receipt Title */}
            <div className="text-center mb-4">
              <p className="text-sm font-semibold t-secondary uppercase tracking-wider">Receipt</p>
            </div>

            {/* Bill Info */}
            <div className="space-y-1.5 text-sm mb-4 px-1">
              <div className="flex justify-between">
                <span className="t-muted">Bill No:</span>
                <span className="font-semibold t-primary">{bill.bill_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="t-muted">Date:</span>
                <span className="font-medium t-secondary">{formatDate(bill.bill_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="t-muted">Customer:</span>
                <span className="font-medium t-secondary">{bill.customer_name}</span>
              </div>
              {bill.customer_phone && (
                <div className="flex justify-between">
                  <span className="t-muted">Phone:</span>
                  <span className="font-medium t-secondary">{bill.customer_phone}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <table className="w-full text-sm mb-4 border border-default rounded">
              <thead>
                <tr className="bg-surface-subtle border-b border-default">
                  <th className="text-left py-2.5 px-3 t-secondary font-semibold text-xs uppercase tracking-wide">Service</th>
                  <th className="text-center py-2.5 px-2 t-secondary font-semibold text-xs uppercase tracking-wide">Qty</th>
                  <th className="text-right py-2.5 px-3 t-secondary font-semibold text-xs uppercase tracking-wide">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={item.id} className={idx !== items.length - 1 ? 'border-b border-default' : ''}>
                    <td className="py-2.5 px-3 t-secondary">
                      {item.service_name}
                      {item.variant && <span className="t-muted block text-xs">{item.variant}</span>}
                      {Number(item.discount) > 0 && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 block">Discount: -{formatCurrency(Number(item.discount))}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center t-secondary">{item.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-medium t-secondary">{formatCurrency(Number(item.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="border-t-2 border-brand-500/30 pt-3 px-1 space-y-2">
              <div className="flex justify-between text-base font-bold t-primary">
                <span>Total Amount</span>
                <span>{formatCurrency(Number(bill.total_amount))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600 dark:text-green-400 font-medium">Amount Received</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">{formatCurrency(Number(bill.amount_received))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="t-muted">Balance Due</span>
                <span className={Number(bill.balance) > 0 ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-green-600 dark:text-green-400 font-bold'}>
                  {Number(bill.balance) > 0 ? formatCurrency(Number(bill.balance)) : 'PAID'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="t-muted">Payment Method</span>
                <span className="font-medium t-secondary">{bill.payment_method}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-6 pt-4 border-t border-default">
              <p className="font-serif text-base text-brand-600 dark:text-brand-400 font-semibold">
                Thank you for choosing {settings?.business_name || 'LAKSHMI STUDIO'}!
              </p>
              <p className="text-xs t-faint mt-1">This is a computer-generated receipt.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 p-4 border-t border-default no-print">
          <button className="btn btn-primary flex-1" onClick={onPrint}>
            <Printer className="w-4 h-4" /> Print Receipt
          </button>
          <button className="btn btn-secondary flex-1" onClick={onClose}>
            <FileText className="w-4 h-4" /> New Bill
          </button>
        </div>
      </div>
    </div>
  );
}
