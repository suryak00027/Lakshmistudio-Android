import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Plus,
  UserCog,
  Phone,
  ArrowLeft,
  Trash2,
  Calendar,
  Wallet,
  TrendingUp,
  Camera as CameraIcon,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Staff, Attendance, SalaryRecord, SalaryAdvance, EventStaff } from '@/lib/types';
import { formatCurrency, formatDate, todayISO, currentMonthISO } from '@/lib/utils';
import { STAFF_ROLES, ATTENDANCE_STATUSES } from '@/lib/constants';
import { uploadImage } from '@/lib/storage';
import { useToast } from '@/components/Toast';
import { useLanguage } from '@/lib/i18n';
import { Modal } from '@/components/Modal';
import { EmptyState, LoadingState, ConfirmDialog } from '@/components/Feedback';
import { StatusBadge } from '@/components/StatusBadge';
import { Avatar } from '@/components/Avatar';
import { ImageCropper } from '@/components/ImageCropper';
import { logSupabaseError, getErrorToastMessage } from '@/lib/supabase-error';

export function StaffPage() {
  const { t } = useLanguage();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { show } = useToast();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Photographer');
  const [salary, setSalary] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [rawPhotoFile, setRawPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('staff').select('*').order('name');
    setStaff((data || []) as Staff[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      show(t('staff.photoUnder5mb'), 'error');
      return;
    }
    setRawPhotoFile(file);
  };

  const handlePhotoCropConfirm = (cropped: File) => {
    setPhotoFile(cropped);
    setPhotoPreview(URL.createObjectURL(cropped));
    setRawPhotoFile(null);
  };

  const handleAdd = async () => {
    if (!name.trim()) {
      show(t('staff.enterName'), 'error');
      return;
    }
    setSaving(true);
    try {
      let photoUrl = '';
      if (photoFile) {
        photoUrl = await uploadImage(photoFile, 'staff');
      }
      const { error } = await supabase.from('staff').insert({
        name: name.trim(),
        phone: phone.trim(),
        role,
        monthly_salary: parseFloat(salary) || 0,
        notes: notes.trim(),
        photo_url: photoUrl,
      });
      if (error) {
        const info = logSupabaseError(error, 'Add staff');
        show(getErrorToastMessage(info), 'error');
        return;
      }
      show(t('staff.addedSuccess'));
      setShowAdd(false);
      setName('');
      setPhone('');
      setRole('Photographer');
      setSalary('');
      setNotes('');
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchStaff();
    } catch (error) {
      const info = logSupabaseError(error, 'Add staff (upload)');
      show(getErrorToastMessage(info), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (selectedId) {
    return (
      <StaffProfile
        staffId={selectedId}
        onBack={() => {
          setSelectedId(null);
          fetchStaff();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">{t('staff.title')}</h1>
          <p className="page-subtitle">{t('staff.subtitle')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> {t('staff.addStaff')}
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : staff.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<UserCog className="w-8 h-8" />}
            title={t('staff.noStaff')}
            message={t('staff.noStaffMsg')}
            action={
              <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4" /> {t('staff.addStaff')}
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <button
              key={member.id}
              onClick={() => setSelectedId(member.id)}
              className="card card-hover p-5 text-left"
            >
              <div className="flex items-start gap-3">
                <Avatar src={member.photo_url || null} name={member.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold t-primary truncate">{member.name}</p>
                  <p className="text-sm text-brand-600 dark:text-brand-400">{member.role}</p>
                  <p className="text-sm t-muted mt-1">{formatCurrency(Number(member.monthly_salary))}{t('staff.perMonth')}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-default">
                <StatusBadge status={member.status} />
              </div>
            </button>
          ))}
        </div>
      )}

      {showAdd && (
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t('staff.addStaff')} size="md">
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <Avatar src={photoPreview || null} name={name || '?'} size="xl" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-gradient-brand text-white flex items-center justify-center shadow-md hover:shadow-glow transition-all active:scale-90"
                >
                  <CameraIcon className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              {photoFile && (
                <button
                  onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                  className="text-xs t-muted hover:text-red-500"
                >
                  {t('staff.removePhoto')}
                </button>
              )}
            </div>
            <div>
              <label className="label">{t('common.name')}</label>
              <input className="input" placeholder={t('staff.namePlaceholder')} value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('common.phone')}</label>
              <input className="input" placeholder={t('staff.phonePlaceholder')} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="staff-role">{t('common.role')}</label>
              <select
                id="staff-role"
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {STAFF_ROLES.map((staffRole) => (
                  <option key={staffRole} value={staffRole}>{staffRole}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('staff.monthlySalary')}</label>
              <input type="number" min="0" className="input" placeholder={t('staff.salaryPlaceholder')} value={salary} onChange={(e) => setSalary(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('common.notes')}</label>
              <textarea className="input" rows={2} placeholder={t('staff.notesPlaceholder')} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setShowAdd(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary flex-1" onClick={handleAdd} disabled={saving}>
                {saving ? t('common.saving') : t('staff.addStaff')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {rawPhotoFile && (
        <ImageCropper
          file={rawPhotoFile}
          title={t('staff.cropPhoto')}
          onCancel={() => setRawPhotoFile(null)}
          onConfirm={handlePhotoCropConfirm}
        />
      )}
    </div>
  );
}

function StaffProfile({ staffId, onBack }: { staffId: string; onBack: () => void }) {
  const { t } = useLanguage();
  const { show } = useToast();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'attendance' | 'salary'>('overview');

  const [attendanceMonth, setAttendanceMonth] = useState(currentMonthISO());
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvance[]>([]);
  const [assignments, setAssignments] = useState<(EventStaff & { event_name: string; event_date: string })[]>([]);

  const [showSalaryPayment, setShowSalaryPayment] = useState(false);
  const [showSalaryAdvance, setShowSalaryAdvance] = useState(false);
  const [salAmount, setSalAmount] = useState('');
  const [salNote, setSalNote] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceNote, setAdvanceNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const fetchAll = useCallback(async () => {
    const [staffData, attData, salData, advData, esData, eventsData] = await Promise.all([
      supabase.from('staff').select('*').eq('id', staffId).maybeSingle(),
      supabase.from('attendance').select('*').eq('staff_id', staffId).gte('attendance_date', `${attendanceMonth}-01`).lte('attendance_date', `${attendanceMonth}-31`),
      supabase.from('salary_records').select('*').eq('staff_id', staffId).order('payment_date', { ascending: false }),
      supabase.from('salary_advances').select('*').eq('staff_id', staffId).order('advance_date', { ascending: false }),
      supabase.from('event_staff').select('*').eq('staff_id', staffId),
      supabase.from('events').select('id,event_type,event_date,customer_name'),
    ]);
    setStaff(staffData.data as Staff | null);
    setAttendance((attData.data || []) as Attendance[]);
    setSalaryRecords((salData.data || []) as SalaryRecord[]);
    setSalaryAdvances((advData.data || []) as SalaryAdvance[]);

    const allEvents = (eventsData.data || []) as Record<string, unknown>[];
    const enriched = (esData.data || []).map((es: EventStaff) => {
      const evt = allEvents.find((e) => e.id === es.event_id);
      return { ...es, event_name: evt ? `${evt.event_type} — ${evt.customer_name}` : 'Unknown', event_date: (evt?.event_date as string) || '' };
    });
    setAssignments(enriched);
    setLoading(false);
  }, [staffId, attendanceMonth]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const markAttendance = async (date: string, status: string) => {
    const existing = attendance.find((a) => a.attendance_date === date);
    if (existing) {
      await supabase.from('attendance').update({ status }).eq('id', existing.id);
    } else {
      await supabase.from('attendance').insert({
        staff_id: staffId,
        attendance_date: date,
        status,
      });
    }
    fetchAll();
  };

  const handleSalaryPayment = async () => {
    const amount = parseFloat(salAmount) || 0;
    if (amount <= 0) {
      show(t('staff.enterValidAmount'), 'error');
      return;
    }
    await supabase.from('salary_records').insert({
      staff_id: staffId,
      amount,
      month: currentMonthISO(),
      note: salNote,
      payment_date: todayISO(),
    });
    show(t('staff.salaryPaymentRecorded'));
    setShowSalaryPayment(false);
    setSalAmount('');
    setSalNote('');
    fetchAll();
  };

  const handleSalaryAdvance = async () => {
    const amount = parseFloat(advanceAmount) || 0;
    if (amount <= 0) {
      show(t('staff.enterValidAmount'), 'error');
      return;
    }
    await supabase.from('salary_advances').insert({
      staff_id: staffId,
      amount,
      note: advanceNote,
      advance_date: todayISO(),
    });
    show(t('staff.salaryAdvanceRecorded'));
    setShowSalaryAdvance(false);
    setAdvanceAmount('');
    setAdvanceNote('');
    fetchAll();
  };

  const handleDelete = async () => {
    await supabase.from('staff').delete().eq('id', staffId);
    show(t('staff.memberRemoved'));
    onBack();
  };

  if (loading) return <LoadingState />;
  if (!staff) return <p className="t-muted">{t('staff.notFound')}</p>;

  const [year, month] = attendanceMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = todayISO();

  const attendanceLabels: Record<string, string> = {
    P: t('staff.present'),
    A: t('staff.absent'),
    L: t('staff.leave'),
    E: t('staff.eventDuty'),
  };

  const summary = ATTENDANCE_STATUSES.map((s) => ({
    ...s,
    label: attendanceLabels[s.key] || s.label,
    count: attendance.filter((a) => a.status === s.key).length,
  }));

  const totalPaid = salaryRecords.reduce((s, r) => s + Number(r.amount), 0);
  const totalAdvance = salaryAdvances.reduce((s, a) => s + Number(a.amount), 0);
  const monthlySalary = Number(staff.monthly_salary);
  const netPayable = monthlySalary - totalAdvance;
  const remaining = netPayable - totalPaid;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm t-muted hover:t-secondary">
        <ArrowLeft className="w-4 h-4" /> {t('staff.backToStaff')}
      </button>

      <div className="card p-6">
        <div className="flex items-start gap-4">
          <Avatar src={staff.photo_url || null} name={staff.name} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold t-primary">{staff.name}</h1>
            <p className="text-brand-600 dark:text-brand-400 font-medium">{staff.role}</p>
            {staff.phone && (
              <a href={`tel:${staff.phone}`} className="flex items-center gap-2 t-muted hover:text-brand-600 dark:text-brand-400 mt-1 text-sm">
                <Phone className="w-4 h-4" /> {staff.phone}
              </a>
            )}
          </div>
          <StatusBadge status={staff.status} />
        </div>
      </div>

      <div className="flex gap-1 bg-surface rounded-lg border border-default p-1">
        {(['overview', 'attendance', 'salary'] as const).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === tabKey ? 'bg-gradient-brand text-white shadow-sm' : 't-muted hover:bg-surface-subtle'
            }`}
          >
            {tabKey === 'overview' ? t('staff.overview') : tabKey === 'attendance' ? t('staff.attendance') : t('staff.salaryTab')}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <h2 className="section-title mb-4">{t('staff.profile')}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="t-muted">{t('common.role')}</span><span className="t-secondary font-medium">{staff.role}</span></div>
              <div className="flex justify-between"><span className="t-muted">{t('staff.monthlySalary')}</span><span className="t-secondary font-medium">{formatCurrency(monthlySalary)}</span></div>
              <div className="flex justify-between"><span className="t-muted">{t('common.phone')}</span><span className="t-secondary font-medium">{staff.phone || '—'}</span></div>
            </div>
            {staff.notes && (
              <div className="mt-4 pt-4 border-t border-default">
                <p className="text-sm t-muted mb-1">{t('common.notes')}</p>
                <p className="text-sm t-secondary">{staff.notes}</p>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="section-title flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-brand-600 dark:text-brand-400" /> {t('staff.eventAssignments')}
            </h2>
            {assignments.length === 0 ? (
              <p className="text-sm t-muted py-4 text-center">{t('staff.noAssignments')}</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((as) => (
                  <div key={as.id} className="flex items-center justify-between py-2 border-b border-default last:border-0">
                    <div>
                      <p className="text-sm font-medium t-secondary">{as.event_name}</p>
                      <p className="text-xs t-muted">{formatDate(as.event_date)} · {as.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="month"
              className="input sm:w-48"
              value={attendanceMonth}
              onChange={(e) => setAttendanceMonth(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summary.map((s) => (
              <div key={s.key} className="card p-4 text-center">
                <p className="text-sm t-muted">{s.label}</p>
                <p className="text-2xl font-bold t-primary mt-1">{s.count}</p>
              </div>
            ))}
          </div>

          <div className="card p-5 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-default">
                  <th className="text-left py-2 px-2 t-muted font-medium">{t('common.date')}</th>
                  {ATTENDANCE_STATUSES.map((s) => (
                    <th key={s.key} className="py-2 px-2 t-muted font-medium text-center">{s.key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const d = i + 1;
                  const dateStr = `${attendanceMonth}-${String(d).padStart(2, '0')}`;
                  const att = attendance.find((a) => a.attendance_date === dateStr);
                  const isFuture = dateStr > today;
                  return (
                    <tr key={d} className="border-b border-default">
                      <td className="py-2 px-2 t-secondary">{d} — {new Date(year, month - 1, d).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
                      {ATTENDANCE_STATUSES.map((s) => (
                        <td key={s.key} className="py-1.5 px-2 text-center">
                          <button
                            disabled={isFuture}
                            onClick={() => markAttendance(dateStr, s.key)}
                            className={`w-8 h-8 rounded-md text-xs font-bold transition-colors ${
                              att?.status === s.key
                                ? s.color === 'success' ? 'bg-green-500 text-white'
                                  : s.color === 'error' ? 'bg-red-500 text-white'
                                  : s.color === 'warning' ? 'bg-amber-500 text-white'
                                  : 'bg-brand-500 text-white'
                                : 'bg-surface-subtle t-faint hover:bg-surface-subtle'
                            } ${isFuture ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            {s.key}
                          </button>
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'salary' && (
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="section-title mb-4">{t('staff.salarySummary')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-3 bg-surface-subtle rounded-lg">
                <p className="t-muted">{t('common.salary')}</p>
                <p className="text-lg font-bold t-primary mt-1">{formatCurrency(monthlySalary)}</p>
              </div>
              <div className="p-3 bg-surface-subtle rounded-lg">
                <p className="t-muted">{t('staff.advances')}</p>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(totalAdvance)}</p>
              </div>
              <div className="p-3 bg-surface-subtle rounded-lg">
                <p className="t-muted">{t('staff.netPayable')}</p>
                <p className="text-lg font-bold text-brand-600 dark:text-brand-400 mt-1">{formatCurrency(netPayable)}</p>
              </div>
              <div className="p-3 bg-surface-subtle rounded-lg">
                <p className="t-muted">{t('staff.remaining')}</p>
                <p className={`text-lg font-bold mt-1 ${remaining > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{formatCurrency(remaining)}</p>
              </div>
            </div>
            <p className="text-xs t-muted mt-3">{t('staff.advanceDeductionNote')}</p>
            <div className="flex gap-3 mt-4">
              <button className="btn btn-primary flex-1" onClick={() => setShowSalaryPayment(true)}>
                <Wallet className="w-4 h-4" /> {t('staff.salaryPayment')}
              </button>
              <button className="btn btn-secondary flex-1" onClick={() => setShowSalaryAdvance(true)}>
                <TrendingUp className="w-4 h-4" /> {t('staff.salaryAdvance')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="section-title mb-4">{t('staff.paymentHistory')}</h2>
              {salaryRecords.length === 0 ? (
                <p className="text-sm t-muted py-4 text-center">{t('staff.noPayments')}</p>
              ) : (
                <div className="space-y-2">
                  {salaryRecords.map((r) => (
                    <div key={r.id} className="flex justify-between py-2 border-b border-default last:border-0 text-sm">
                      <div>
                        <p className="t-secondary font-medium">{formatCurrency(Number(r.amount))}</p>
                        <p className="text-xs t-muted">{formatDate(r.payment_date)} · {r.month}</p>
                      </div>
                      {r.note && <span className="text-xs t-muted self-center">{r.note}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-5">
              <h2 className="section-title mb-4">{t('staff.advanceHistory')}</h2>
              {salaryAdvances.length === 0 ? (
                <p className="text-sm t-muted py-4 text-center">{t('staff.noAdvances')}</p>
              ) : (
                <div className="space-y-2">
                  {salaryAdvances.map((a) => (
                    <div key={a.id} className="flex justify-between py-2 border-b border-default last:border-0 text-sm">
                      <div>
                        <p className="t-secondary font-medium">{formatCurrency(Number(a.amount))}</p>
                        <p className="text-xs t-muted">{formatDate(a.advance_date)}</p>
                      </div>
                      {a.note && <span className="text-xs t-muted self-center">{a.note}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>
          <Trash2 className="w-4 h-4" /> {t('staff.removeStaff')}
        </button>
      </div>

      {showSalaryPayment && (
        <Modal open={showSalaryPayment} onClose={() => setShowSalaryPayment(false)} title={t('staff.recordSalaryPayment')} size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">{t('common.amount')}</label>
              <input type="number" min="0" className="input" placeholder="0" value={salAmount} onChange={(e) => setSalAmount(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('common.notes')}</label>
              <input className="input" placeholder={t('common.optional')} value={salNote} onChange={(e) => setSalNote(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setShowSalaryPayment(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary flex-1" onClick={handleSalaryPayment}>{t('common.save')}</button>
            </div>
          </div>
        </Modal>
      )}

      {showSalaryAdvance && (
        <Modal open={showSalaryAdvance} onClose={() => setShowSalaryAdvance(false)} title={t('staff.recordSalaryAdvance')} size="sm">
          <div className="space-y-4">
            <div>
              <label className="label">{t('common.amount')}</label>
              <input type="number" min="0" className="input" placeholder="0" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} />
            </div>
            <div>
              <label className="label">{t('common.notes')}</label>
              <input className="input" placeholder={t('common.optional')} value={advanceNote} onChange={(e) => setAdvanceNote(e.target.value)} />
            </div>
            <div className="flex gap-3">
              <button className="btn btn-secondary flex-1" onClick={() => setShowSalaryAdvance(false)}>{t('common.cancel')}</button>
              <button className="btn btn-primary flex-1" onClick={handleSalaryAdvance}>{t('common.save')}</button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title={t('staff.removeStaff')}
        message={`${t('staff.removeConfirm')} ${staff.name}? ${t('staff.cannotUndo')}`}
        confirmLabel={t('common.remove')}
        danger
        onCancel={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
