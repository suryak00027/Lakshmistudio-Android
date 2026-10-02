import { type ReactNode } from 'react';

export function EmptyState({
  icon,
  title,
  message,
  action,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{
          backgroundColor: 'var(--empty-icon-bg)',
          color: 'var(--empty-icon-text)',
        }}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold t-primary">{title}</h3>
      <p className="text-sm t-muted mt-1 max-w-sm">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 border-2 border-brand-200 rounded-full" />
        <div className="absolute inset-0 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-sm t-muted mt-3">{message}</p>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  danger = false,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm animate-fade-in"
        style={{ backgroundColor: 'var(--overlay)' }}
        onClick={onCancel}
      />
      <div
        className="relative rounded-xl shadow-xl w-full max-w-sm p-6 animate-scale-in"
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <h3 className="text-lg font-semibold t-primary">{title}</h3>
        <p className="text-sm t-muted mt-2">{message}</p>
        <div className="flex gap-3 mt-6">
          <button className="btn btn-secondary flex-1" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn flex-1 ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
