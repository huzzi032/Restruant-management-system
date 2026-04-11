import type { ReactNode } from 'react';
import { MarketingNav } from './MarketingNav';
import { MarketingFooter } from './MarketingFooter';

type MarketingShellProps = {
  children: ReactNode;
  /** Skip nav/footer for full-screen auth, etc. */
  bare?: boolean;
};

export function MarketingShell({ children, bare }: MarketingShellProps) {
  if (bare) {
    return <div className="min-h-screen bg-[#1A1A1A]">{children}</div>;
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#1A1A1A] text-white">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
