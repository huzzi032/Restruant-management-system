import { Link } from 'react-router-dom';
import { Bot, ChefHat, CreditCard, LayoutDashboard, LineChart, Settings, Store, TabletSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingShell } from '@/components/marketing/MarketingShell';

const pillars = [
  {
    title: 'Front of house',
    description: 'Table-aware ordering, fast modifications, and clear communication to the kitchen.',
    icon: TabletSmartphone,
  },
  {
    title: 'Back of house',
    description: 'Kitchen display with live ticket states so prep stays coordinated during rush.',
    icon: ChefHat,
  },
  {
    title: 'Finance & checkout',
    description: 'Billing workflows built for cashiers with audit-friendly totals and handoffs.',
    icon: CreditCard,
  },
  {
    title: 'Leadership & reporting',
    description: 'Dashboards and exports that answer what sold, when you peaked, and how labor lined up.',
    icon: LineChart,
  },
  {
    title: 'Menu & inventory',
    description: 'Central menu control with stock signals so you reduce waste and 86s.',
    icon: Store,
  },
  {
    title: 'Administration',
    description: 'Staff portals, roles, and restaurant settings in one secure admin surface.',
    icon: Settings,
  },
];

export default function Features() {
  return (
    <MarketingShell>
      <div className="border-b border-white/10 bg-[#141414] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 px-3 py-1 font-sans text-xs font-semibold uppercase tracking-wide text-[#93C5FD]">
            <Bot className="h-3.5 w-3.5" />
            Product depth
          </div>
          <h1 className="mt-6 max-w-3xl font-heading text-4xl font-bold text-white sm:text-5xl">
            Built for full-service <span className="text-[#FF6A47]">restaurants</span>
          </h1>
          <p className="mt-5 max-w-2xl font-sans text-lg text-white/70">
            Servify AI connects every shift: service, kitchen, cash, and leadership — with optional AI assistance where
            it speeds up decisions.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-6 transition-colors hover:border-[#FF6A47]/25"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-[#FF6A47]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 font-heading text-lg font-semibold text-white">{p.title}</h2>
                <p className="mt-2 font-sans text-sm leading-relaxed text-white/60">{p.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-6 rounded-2xl border border-white/10 bg-[#141414] p-8 sm:flex-row sm:p-10">
          <div className="flex items-start gap-4">
            <LayoutDashboard className="h-10 w-10 shrink-0 text-[#3B82F6]" />
            <div>
              <h3 className="font-heading text-xl font-semibold text-white">See it in your own portal</h3>
              <p className="mt-2 font-sans text-sm text-white/65">
                Spin up a restaurant, add staff roles, and walk the same flows your team will use daily.
              </p>
            </div>
          </div>
          <Button
            className="shrink-0 font-sans font-semibold bg-[#FF6A47] text-white hover:bg-[#ff5a38]"
            size="lg"
            asChild
          >
            <Link to="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </MarketingShell>
  );
}
