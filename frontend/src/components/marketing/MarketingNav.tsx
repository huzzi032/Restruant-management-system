import { Link, useLocation } from 'react-router-dom';
import { ServifyLogo } from './ServifyLogo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { useState } from 'react';

const links = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/contact', label: 'Contact' },
];

export function MarketingNav() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1A1A1A]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <ServifyLogo size="md" />

        <nav className="hidden items-center gap-8 md:flex">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'font-sans text-sm font-medium text-white/80 transition-colors hover:text-white',
                pathname === to && 'text-[#FF6A47]',
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Button
            variant="ghost"
            className="font-sans text-white/90 hover:bg-white/10 hover:text-white"
            asChild
          >
            <Link to="/signin">Sign in</Link>
          </Button>
          <Button
            className="font-sans font-semibold bg-[#FF6A47] text-white shadow-md shadow-[#FF6A47]/25 hover:bg-[#ff5a38]"
            asChild
          >
            <Link to="/signup">Get started</Link>
          </Button>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-white md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#1A1A1A] px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="font-sans text-sm font-medium text-white/90 py-2"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            <Link
              to="/signin"
              className="font-sans text-sm py-2 text-white/80"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Button
              className="mt-2 w-full font-sans font-semibold bg-[#FF6A47] text-white hover:bg-[#ff5a38]"
              asChild
            >
              <Link to="/signup" onClick={() => setOpen(false)}>
                Get started
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
