import { useEffect, useState, useCallback } from 'react';
import { Plus, Receipt, Trash2, TrendingDown, Calendar, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n';
import type { Expense } from '@/lib/types';
import { formatCurrency, formatDate, todayISO, currentMonthISO } from '@/lib/utils';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/lib/constants';
import { useToast } from '@/components/Toast';
import { Modal } from '@/components/Modal';
import { EmptyState, LoadingState, ConfirmDialog } from '@/components/Feedback';
import { logSupabaseError, getErrorToastMessage } from '@/lib/supabase-error';

const CATEGORY_COLORS: Record<string, string> = {
  'Salary': 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  'Travel': 'bg-brand-500/10 text-brand-700 dark:text-brand-400',
  'Fuel': 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  'Electricity': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  'Rent': 'bg-stone-100 text-stone-700 dark:bg-stone-500/15 dark:text-stone-400',
  'Equipment': 'bg-brand-500/10 text-brand-700 dark:text-brand-400',
  'Printing': 'bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  'Paper Cost': 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400',
  'Printer Cartridge': 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  'Frame Materials': 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  'Frame': 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400',
  'Board': 'bg-lime-50 text-lime-700 dark:bg-lime-500/15 dark:text-lime-400',
  'Lamination Materials': 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-400',
  'Maintenance': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  'Maintenance Box': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  'Food': 'bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  'Advertising': 'bg-pink-50 text-pink-700 dark:bg-pink-500/15 dark:text-pink-400',
  'Chemicals': 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400',
  'Ink': 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  'Other': 'bg-surface-subtle t-secondary',
};

export function Expenses() {
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const { show } = useToast();

  const [category, setCategory] = useState('Salary');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [expenseDate, setExpenseDate] = useState(todayISO());
  const [saving, setSaving] = useState(false);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    let q = supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    if (categoryFilter !== 'all') {
      q = q.eq('category', categoryFilter);
    }
    if (search) {
      q = q.or(`category.ilike.%${search}%,description.ilike.%${search}%`);
    }
    const { data } = await q;
    setExpenses((data || []) as Expense[]);
    setLoading(false);
  }, [categoryFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchExpenses, 200);
    return () => clearTimeout(timer);
  }, [fetchExpenses]);

  const today = todayISO();
  const month = currentMonthISO();
  const todayTotal = expenses.filter((e) => e.expense_date === today).reduce((s, e) => s + Number(e.amount), 0);
  const monthTotal = expenses.filter((e) => e.expense_date.startsWith(month)).reduce((s, e) => s + Number(e.amount), 0);

  const handleAdd = async () => {
    const amt = parseFloat(amount) || 0;
    if (amt <= 0) {
      show('Please enter a valid amount.', 'error');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('expenses').insert({
      category,
      description: description.trim(),
      amount: amt,
      payment_method: paymentMethod,
      expense_date: expenseDate,
    });
    if (error) {
      const info = logSupabaseError(error, 'Add expense');
      show(getErrorToastMessage(info), 'error');
      setSaving(false);
      return;
    }
    show('Expense added successfully');
    setShowAdd(false);
    setDescription('');
    setAmount('');
    setSaving(false);
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      const info = logSupabaseError(error, 'Delete expense');
      show(getErrorToastMessage(info), 'error');
      return;
    }
    show('Expense deleted');
    setConfirmDelete(null);
    fetchExpenses();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('expenses.title' as never)}</h1>
          <p className="page-subtitle">{t('expenses.subtitle' as never)}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> {t('expenses.addExpense' as never)}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-sm t-muted">Today's Expenses</p>
          </div>
          <p className="text-2xl font-bold t-primary">{formatCurrency(todayTotal)}</p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <p className="text-sm t-muted">This Month</p>
          </div>
          <p className="text-2xl font-bold t-primary">{formatCurrency(monthTotal)}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 t-faint" />
          <input
            className="input pl-11"
            placeholder="Search category or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-48"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="all">All Categories</option>
          {EXPENSE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingState />
      ) : expenses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Receipt className="w-8 h-8" />}
            title={t('expenses.noExpenses' as never)}
            message="Start tracking your business expenses to see them here."
            action={
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4" /> {t('expenses.addExpense' as never)}
              </button>
            }
          />
        </div>
      ) : (
        <div className="card divide-y divide-themed">
          {expenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-4 group">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                  <Receipt className="w-5 h-5 text-red-500" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS['Other']}`}>
                      {expense.category}
                    </span>
                  </div>
                  {expense.description && (
                    <p className="text-sm t-secondary truncate mt-0.5">{expense.description}</p>
                  )}
                  <p className="text-xs t-muted mt-0.5">
                    {formatDate(expense.expense_date)} · {expense.payment_method}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <p className="font-semibold t-primary">{formatCurrency(Number(expense.amount))}</p>
                <button
                  onClick={() => setConfirmDelete(expense.id)}
                  className="t-faint hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t('expenses.addExpense' as never)} size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">{t('expenses.category' as never)}</label>
              <input
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="expense-categories"
                placeholder="Select or type a custom category"
              />
              <datalist id="expense-categories">
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} />)}
              </datalist>
              <p className="text-xs t-muted mt-1">You can type any custom category name.</p>
            </div>
            <div>
              <label className="label">{t('expenses.description' as never)}</label>
              <input className="input" placeholder="What was this expense for?" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label className="label">Amount</label>
              <input type="number" min="0" className="input" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('expenses.paymentMethod' as never)}</label>
              <select className="input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('expenses.expenseDate' as never)}</label>
              <input type="date" className="input" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn btn-primary flex-1" onClick={handleAdd} disabled={saving}>
                {saving ? 'Saving...' : t('expenses.addExpense' as never)}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense?"
        confirmLabel="Delete"
        danger
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
      />
    </div>
  );
}
