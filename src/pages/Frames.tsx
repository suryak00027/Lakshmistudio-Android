import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Frame, X, Phone, UserPlus, Trash2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import type { FrameOrder, Customer, Payment } from '@/lib/types';
import { formatCurrency, formatDate, todayISO, generateOrderNumber } from '@/lib/utils';
import { FRAME_ORDER_TYPES, FRAME_ORDER_STATUSES, PAYMENT_METHODS } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { EmptyState, LoadingState, ConfirmDialog } from '@/components/Feedback';
import { StatusBadge, PaymentBadge } from '@/components/StatusBadge';
import { logSupabaseError, getErrorToastMessage } from '@/lib/supabase-error';

type TabKey = 'all' | 'New' | 'Processing' | 'Ready' | 'Delivered' | 'Cancelled';

export function Frames() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<FrameOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<TabKey>('all');
  const [showNew, setShowNew] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<FrameOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('frame_orders').select('*').order('created_at', { ascending: false });
    if (tab !== 'all') {
      q = q.eq('status', tab);
    }
    if (search) {
      q = q.or(`customer_name.ilike.%${search}%,order_number.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }
    const { data } = await q;
    setOrders((data || []) as FrameOrder[]);
    setLoading(false);
  }, [tab, search]);

  useEffect(() => {
    const t = setTimeout(fetchOrders, 200);
    return () => clearTimeout(t);
  }, [fetchOrders]);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'New', label: 'New' },
    { key: 'Processing', label: 'Processing' },
    { key: 'Ready', label: 'Ready' },
    { key: 'Delivered', label: 'Delivered' },
    { key: 'Cancelled', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('frames.title' as never)}</h1>
          <p className="page-subtitle">{t('frames.subtitle' as never)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4" /> {t('frames.addOrder' as never)}
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 t-faint" />
        <input
          className="input pl-11"
          placeholder="Search customer, phone, or order number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex gap-1 overflow-x-auto bg-surface rounded-lg border border-default p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.key ? 'bg-gradient-brand text-white shadow-sm' : 't-muted hover:bg-surface-subtle'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState />
      ) : orders.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Frame className="w-8 h-8" />}
            title={t('frames.noOrders' as never)}
            message="Create your first frame or lamination order."
            action={
              <button className="btn btn-primary" onClick={() => setShowNew(true)}>
                <Plus className="w-4 h-4" /> {t('frames.addOrder' as never)}
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map((order) => (
            <button
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="card card-hover p-5 text-left"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">{order.order_number}</p>
                  <p className="font-medium t-primary mt-0.5">{order.customer_name}</p>
                  <p className="text-sm t-muted">{order.order_type}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {order.size && (
                  <div><p className="t-muted">Size</p><p className="t-secondary font-medium">{order.size}</p></div>
                )}
                <div><p className="t-muted">Qty</p><p className="t-secondary font-medium">{order.quantity}</p></div>
                <div><p className="t-muted">Total</p><p className="t-secondary font-medium">{formatCurrency(Number(order.total_price))}</p></div>
                <div><p className="t-muted">Delivery</p><p className="t-secondary font-medium">{formatDate(order.delivery_date)}</p></div>
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-default">
                <PaymentBadge balance={Number(order.balance)} />
                {Number(order.balance) > 0 && (
                  <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    Bal: {formatCurrency(Number(order.balance))}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {showNew && (
        <NewOrderForm
          onClose={() => setShowNew(false)}
          onSaved={() => {
            setShowNew(false);
            fetchOrders();
          }}
        />
      )}

      {selectedOrder && (
        <OrderDetail
          order={selectedOrder}
          onBack={() => {
            setSelectedOrder(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}

function NewOrderForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { show } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [existingNumbers, setExistingNumbers] = useState<string[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');

  const [orderType, setOrderType] = useState('Frame');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [material, setMaterial] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  const [amountReceived, setAmountReceived] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [cust, bills] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('frame_orders').select('order_number'),
      ]);
      setCustomers((cust.data || []) as Customer[]);
      setExistingNumbers((bills.data || []).map((b: Record<string, unknown>) => b.order_number as string));
    })();
  }, []);

  const filteredCustomers = customerSearch
    ? customers.filter(
        (c) => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
      )
    : customers.slice(0, 5);

  const total = parseFloat(totalPrice) || 0;
  const received = parseFloat(amountReceived) || 0;
  const balance = total - received;

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
      const info = logSupabaseError(error, 'Add customer (frame order)');
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

  const handleSave = async () => {
    if (!selectedCustomer && !newCustName.trim()) {
      show('Please select or create a customer.', 'error');
      return;
    }
    if (total <= 0) {
      show('Please enter a valid total price.', 'error');
      return;
    }
    if (received > total) {
      show('Amount received cannot be greater than the total price.', 'error');
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

    const orderNumber = generateOrderNumber(existingNumbers);

    const { data: orderData, error } = await supabase
      .from('frame_orders')
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        customer_name: customerName,
        customer_phone: customerPhone,
        order_type: orderType,
        size,
        quantity: parseInt(quantity) || 1,
        material,
        total_price: total,
        amount_received: received,
        balance,
        delivery_date: deliveryDate || null,
        status: 'New',
        notes,
      })
      .select()
      .single();

    if (error || !orderData) {
      const info = logSupabaseError(error, 'Create frame order');
      show(getErrorToastMessage(info), 'error');
      setSaving(false);
      return;
    }

    if (received > 0) {
      await supabase.from('payments').insert({
        frame_order_id: (orderData as FrameOrder).id,
        amount: received,
        payment_method: 'Cash',
        payment_date: todayISO(),
        note: 'Advance payment',
      });
    }

    show('Order created successfully');
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 backdrop-blur-sm animate-fade-in" style={{ backgroundColor: "var(--overlay)" }} onClick={onClose} />
      <div className="relative bg-surface rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-default">
          <h2 className="text-lg font-semibold t-primary">New Frame/Lamination Order</h2>
          <button onClick={onClose} className="t-faint hover:t-secondary p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label className="label">Customer</label>
            <div className="relative mb-2">
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Order Type</label>
              <select className="input" value={orderType} onChange={(e) => setOrderType(e.target.value)}>
                {FRAME_ORDER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Size</label>
              <input className="input" placeholder="e.g. 12 × 18" value={size} onChange={(e) => setSize(e.target.value)} />
            </div>
            <div>
              <label className="label">Quantity</label>
              <input type="number" min="1" className="input" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
            </div>
            <div>
              <label className="label">Material/Type</label>
              <input className="input" placeholder="Optional" value={material} onChange={(e) => setMaterial(e.target.value)} />
            </div>
            <div>
              <label className="label">Total Price</label>
              <input type="number" min="0" className="input" placeholder="0" value={totalPrice} onChange={(e) => setTotalPrice(e.target.value)} />
            </div>
            <div>
              <label className="label">Amount Received</label>
              <input type="number" min="0" className="input" placeholder="0" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Delivery Date</label>
              <input type="date" className="input" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <textarea className="input" rows={2} placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-between p-3 bg-surface-subtle rounded-lg">
            <span className="text-sm t-muted">Balance</span>
            <span className={`text-sm font-semibold ${balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
              {formatCurrency(balance)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t border-default">
          <button className="btn btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary flex-1" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Create Order'}
          </button>
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

function OrderDetail({ order, onBack }: { order: FrameOrder; onBack: () => void }) {
  const { show } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Cash');
  const [status, setStatus] = useState(order.status);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('frame_order_id', order.id)
        .order('payment_date', { ascending: false });
      setPayments((data || []) as Payment[]);
      setLoading(false);
    })();
  }, [order.id]);

  const totalReceived = Number(order.amount_received) + payments.reduce((s, p) => s + Number(p.amount), 0);
  const balance = Number(order.total_price) - totalReceived;

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
    await supabase.from('payments').insert({
      frame_order_id: order.id,
      amount,
      payment_method: payMethod,
      payment_date: todayISO(),
      note: 'Order payment',
    });
    await supabase.from('frame_orders').update({ balance: balance - amount }).eq('id', order.id);
    show('Payment recorded');
    setShowPayment(false);
    setPayAmount('');
    const { data } = await supabase.from('payments').select('*').eq('frame_order_id', order.id).order('payment_date', { ascending: false });
    setPayments((data || []) as Payment[]);
  };

  const handleStatusChange = async (newStatus: string) => {
    await supabase.from('frame_orders').update({ status: newStatus }).eq('id', order.id);
    setStatus(newStatus);
    show('Status updated');
  };

  const handleDelete = async () => {
    await supabase.from('frame_orders').delete().eq('id', order.id);
    show('Order deleted');
    onBack();
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm t-muted hover:t-secondary">
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </button>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-600 dark:text-brand-400">{order.order_number}</p>
            <h1 className="text-2xl font-bold t-primary mt-1">{order.customer_name}</h1>
            {order.customer_phone && (
              <a href={`tel:${order.customer_phone}`} className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:text-brand-400 mt-1 text-sm">
                <Phone className="w-4 h-4" /> {order.customer_phone}
              </a>
            )}
          </div>
          <div className="flex flex-col gap-2 items-start sm:items-end">
            <StatusBadge status={status} />
            <select className="input sm:w-40 text-sm" value={status} onChange={(e) => handleStatusChange(e.target.value)}>
              {FRAME_ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="section-title mb-4">Order Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="t-muted">Type</span><span className="t-secondary font-medium">{order.order_type}</span></div>
            {order.size && <div className="flex justify-between"><span className="t-muted">Size</span><span className="t-secondary font-medium">{order.size}</span></div>}
            <div className="flex justify-between"><span className="t-muted">Quantity</span><span className="t-secondary font-medium">{order.quantity}</span></div>
            {order.material && <div className="flex justify-between"><span className="t-muted">Material</span><span className="t-secondary font-medium">{order.material}</span></div>}
            <div className="flex justify-between"><span className="t-muted">Delivery Date</span><span className="t-secondary font-medium">{formatDate(order.delivery_date)}</span></div>
          </div>
          {order.notes && (
            <div className="mt-4 pt-4 border-t border-default">
              <p className="text-sm t-muted mb-1">Notes</p>
              <p className="text-sm t-secondary">{order.notes}</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="section-title mb-4">Payment Summary</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-base">
              <span className="t-muted">Total</span>
              <span className="font-semibold t-primary">{formatCurrency(Number(order.total_price))}</span>
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
      </div>

      <div className="flex justify-end">
        <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="w-4 h-4" /> Delete Order
        </button>
      </div>

      {showPayment && (
        <Modal open={showPayment} onClose={() => setShowPayment(false)} title="Record Payment" size="sm">
          <div className="space-y-4">
            <div className="p-3 bg-surface-subtle rounded-lg text-sm">
              <div className="flex justify-between mb-1"><span className="t-muted">Total</span><span className="t-secondary font-medium">{formatCurrency(Number(order.total_price))}</span></div>
              <div className="flex justify-between mb-1"><span className="t-muted">Received</span><span className="text-green-600 dark:text-green-400 font-medium">{formatCurrency(totalReceived)}</span></div>
              <div className="flex justify-between"><span className="t-muted">Balance</span><span className="text-amber-600 dark:text-amber-400 font-medium">{formatCurrency(balance)}</span></div>
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
        title="Delete Order"
        message="Are you sure you want to delete this order? This cannot be undone."
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
