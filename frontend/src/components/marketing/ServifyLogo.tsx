import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import logoIcon from '@/icon.png';

type ServifyLogoProps = {
  className?: string;
  iconOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
};

const sizeMap = {
  sm: { box: 'h-9 w-9 rounded-lg', word: 'text-lg', gap: 'gap-2' },
  md: { box: 'h-10 w-10 rounded-xl', word: 'text-xl', gap: 'gap-2.5' },
  lg: { box: 'h-12 w-12 rounded-2xl', word: 'text-2xl', gap: 'gap-3' },
};

function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={logoIcon}
      alt=""
      draggable={false}
      className={cn('h-full w-full object-contain', className)}
    />
  );
}

export function ServifyLogo({ className, iconOnly = false, size = 'md' }: ServifyLogoProps) {
  const s = sizeMap[size];

  if (iconOnly) {
    return (
      <Link
        to="/"
        className={cn('block shrink-0 overflow-hidden shadow-lg shadow-[#FF6A47]/20', s.box, className)}
        aria-label="Servify AI home"
      >
        <LogoMark className="rounded-[inherit]" />
      </Link>
    );
  }

  return (
    <Link
      to="/"
      className={cn('flex items-center font-heading font-bold text-white', s.gap, className)}
    >
      <span className={cn('flex shrink-0 items-center justify-center overflow-hidden shadow-lg shadow-[#FF6A47]/15', s.box)}>
        <LogoMark />
      </span>
      <span className={cn('tracking-tight', s.word)}>
        Servify <span className="text-[#3B82F6]">AI</span>
      </span>
    </Link>
  );
}
