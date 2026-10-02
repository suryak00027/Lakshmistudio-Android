import { Camera } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-10 h-10 text-sm',
  md: 'w-12 h-12 text-base',
  lg: 'w-16 h-16 text-xl',
  xl: 'w-20 h-20 text-2xl',
};

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const baseClass = sizeMap[size];
  const initials = name?.charAt(0)?.toUpperCase() || '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${baseClass} rounded-full object-cover flex-shrink-0 ring-2 ring-white/20 dark:ring-white/10 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${baseClass} rounded-full bg-gradient-brand text-white flex items-center justify-center font-semibold flex-shrink-0 shadow-sm ${className}`}
    >
      {initials}
    </div>
  );
}

interface LogoProps {
  src?: string | null;
  size?: 'sm' | 'md';
}

const logoDims = {
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
};

const logoIcon = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
};

export function StudioLogo({ src, size = 'md' }: LogoProps) {
  const dims = logoDims[size];
  const icon = logoIcon[size];

  if (src) {
    return (
      <img
        src={src}
        alt="Studio Logo"
        className={`${dims} rounded-xl object-cover flex-shrink-0 ring-1 ring-white/15`}
      />
    );
  }

  return (
    <div className={`${dims} rounded-xl border-2 border-dashed border-brand-400/40 bg-brand-500/10 flex items-center justify-center flex-shrink-0`}>
      <Camera className={`${icon} text-brand-400`} />
    </div>
  );
}
