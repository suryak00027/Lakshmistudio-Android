import { STATUS_COLORS } from '@/lib/constants';

export function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || 'neutral';
  return (
    <span className={`badge badge-${color}`}>
      {status}
    </span>
  );
}

export function PaymentBadge({ balance }: { balance: number }) {
  if (balance <= 0) {
    return <span className="badge badge-success">PAID</span>;
  }
  return <span className="badge badge-warning">Partially Paid</span>;
}
