import { type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, subtitle, children, size = 'md' }: ModalProps) {
  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-sm animate-fade-in"
        style={{ backgroundColor: 'var(--overlay)' }}
        onClick={onClose}
      />
      <div
        className={`relative rounded-xl shadow-xl w-full ${sizeClass} max-h-[90vh] flex flex-col animate-scale-in`}
        style={{ backgroundColor: 'var(--bg-card)' }}
      >
        <div className="flex items-start justify-between px-6 py-4 border-b-themed">
          <div>
            <h2 className="text-lg font-semibold t-primary">{title}</h2>
            {subtitle && <p className="text-sm t-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="t-faint hover:t-secondary transition-colors p-1 -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
