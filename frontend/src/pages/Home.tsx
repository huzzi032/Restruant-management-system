import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import {
  ArrowRight, Bot, Building2, ChartNoAxesCombined, ClipboardList,
  ShieldCheck, Sparkles, Users, Zap, ChefHat, ReceiptText,
  Package, TrendingUp, Clock, CheckCircle2, Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingShell } from '@/components/marketing/MarketingShell';

/* ── animated counter ─────────────────────────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(to / 40);
    const id = setInterval(() => {
      start = Math.min(start + step, to);
      setVal(start);
      if (start >= to) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [inView, to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

/* ── feature cards ────────────────────────────────────────── */
const features = [
  { title: 'AI-Powered Ops', desc: 'Automate decisions, spot bottlenecks, get plain-language guidance.', icon: Bot, accent: '#3B82F6' },
  { title: 'Multi-Restaurant', desc: 'Each venue gets its own portal, data, menu, and staff.', icon: Building2, accent: '#FF6A47' },
  { title: 'Role-Based Workspace', desc: 'Waiters, chefs, cashiers, managers — each sees what they need.', icon: Users, accent: '#8B5CF6' },
  { title: 'Live Kitchen & Billing', desc: 'Orders flow table → kitchen → checkout with clear status.', icon: ClipboardList, accent: '#FF6A47' },
  { title: 'Inventory Control', desc: 'Track stock and usage to trim waste and protect margin.', icon: Zap, accent: '#3B82F6' },
  { title: 'Growth Analytics', desc: 'Dashboards highlight what sells, when you peak, where revenue leaks.', icon: ChartNoAxesCombined, accent: '#10B981' },
];

/* ── mock live orders ─────────────────────────────────────── */
const mockOrders = [
  { table: 'T-04', items: 'Burger × 2, Fries × 1', status: 'ready', time: '2m' },
  { table: 'T-07', items: 'Pasta × 1, Juice × 2', status: 'cooking', time: '8m' },
  { table: 'T-02', items: 'Pizza × 1, Salad × 1', status: 'pending', time: '12m' },
];

const statusColor: Record<string, string> = {
  ready: 'text-emerald-400',
  cooking: 'text-[#FF6A47]',
  pending: 'text-white/40',
};
const statusLabel: Record<string, string> = {
  ready: 'Ready', cooking: 'Cooking', pending: 'Pending',
};

/* ── fade-up variant ──────────────────────────────────────── */
const fadeUp = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } };

export default function Home() {
  return (
    <MarketingShell>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/10">
        {/* background blobs */}
        <motion.div
          className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-[#FF6A47]/12 blur-[140px]"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.6, 0.4] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="pointer-events-none absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[#3B82F6]/10 blur-[120px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-32 lg:px-8">
          <motion.div
            variants={fadeUp} initial="hidden" animate="show"
            transition={{ duration: 0.55 }}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-[#FF6A47]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Smart Service. Smarter Restaurants.
            </motion.div>

            <h1 className="mt-8 font-heading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              The{' '}
              <span className="relative inline-block">
                <span className="relative z-10 text-[#FF6A47]">Complete System</span>
                <motion.span
                  className="absolute inset-x-0 bottom-0 h-1 rounded-full bg-[#FF6A47]/30"
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                />
              </span>
              {' '}for Modern Restaurants
            </h1>

            <p className="mx-auto mt-6 max-w-2xl font-sans text-lg leading-relaxed text-white/65">
              Manage orders, kitchen, inventory, staff, and growth analytics — all from one AI-powered portal. Built for restaurants that mean business.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" className="group h-12 gap-2 px-8 font-sans text-base font-semibold bg-gradient-to-r from-[#FF6A47] to-[#ff4d2e] text-white shadow-lg shadow-[#FF6A47]/30 hover:brightness-110 transition-all" asChild>
                <Link to="/signup">
                  Get started free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 border-white/20 bg-transparent px-8 font-sans text-base text-white hover:bg-white/8 hover:text-white" asChild>
                <Link to="/features">Explore features</Link>
              </Button>
            </div>
          </motion.div>

          {/* ── Animated stats bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mx-auto mt-14 grid max-w-3xl grid-cols-3 gap-4"
          >
            {[
              { value: 500, suffix: '+', label: 'Restaurants' },
              { value: 98, suffix: '%', label: 'Uptime' },
              { value: 3, suffix: 'x', label: 'Faster service' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/8 bg-white/[0.04] px-4 py-5 text-center">
                <p className="font-heading text-3xl font-bold text-[#FF6A47]">
                  <Counter to={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-1 font-sans text-xs text-white/45">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── LIVE DASHBOARD PREVIEW ─────────────────────────── */}
      <section className="border-b border-white/10 bg-[#0f0f0f] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
              See your restaurant <span className="text-[#FF6A47]">live</span>
            </h2>
            <p className="mt-4 font-sans text-white/55">
              A unified command center — orders, kitchen, billing, and analytics in one view.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {/* Orders panel */}
            <motion.div
              variants={fadeUp} initial="hidden" whileInView="show"
              viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}
              className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#141414] p-6"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ReceiptText className="h-5 w-5 text-[#FF6A47]" />
                  <span className="font-heading font-semibold text-white">Live Orders</span>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Live
                </span>
              </div>
              <div className="space-y-3">
                {mockOrders.map((o, i) => (
                  <motion.div
                    key={o.table}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.15 + i * 0.1 }}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6A47]/10 font-mono text-xs font-bold text-[#FF6A47]">{o.table}</span>
                      <div>
                        <p className="font-sans text-sm text-white">{o.items}</p>
                        <p className="font-sans text-xs text-white/40">{o.time} ago</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1.5 font-sans text-xs font-semibold ${statusColor[o.status]}`}>
                      {o.status === 'ready' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                      {statusLabel[o.status]}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Side stats */}
            <div className="flex flex-col gap-6">
              {[
                { icon: TrendingUp, label: "Today's Revenue", value: 'Rs 48,200', color: '#10B981', sub: '+12% vs yesterday' },
                { icon: Package, label: 'Stock Alerts', value: '3 items low', color: '#F59E0B', sub: 'Tomatoes · Rice · Oil' },
                { icon: ChefHat, label: 'Kitchen Load', value: '7 active', color: '#3B82F6', sub: '2 chefs · 5 orders' },
                { icon: Clock, label: 'Avg. Wait Time', value: '9 min', color: '#FF6A47', sub: '↓ 2 min from yesterday' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.label}
                    variants={fadeUp} initial="hidden" whileInView="show"
                    viewport={{ once: true }} transition={{ delay: 0.1 + i * 0.08 }}
                    className="rounded-2xl border border-white/10 bg-[#141414] p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${s.color}18` }}>
                        <Icon className="h-4 w-4" style={{ color: s.color }} />
                      </div>
                      <div>
                        <p className="font-sans text-xs text-white/45">{s.label}</p>
                        <p className="font-heading text-lg font-bold text-white">{s.value}</p>
                        <p className="font-sans text-[10px]" style={{ color: s.color }}>{s.sub}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────── */}
      <section className="border-b border-white/10 bg-[#141414] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
              Everything your team needs to <span className="text-[#3B82F6]">scale</span>
            </h2>
            <p className="mt-4 font-sans text-white/55">
              From first seat to final check — one platform, clear roles, and AI where it actually saves time.
            </p>
          </motion.div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp} initial="hidden" whileInView="show"
                  viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group rounded-2xl border border-white/10 bg-[#1A1A1A] p-6 transition-colors hover:border-white/20"
                  style={{ '--accent': f.accent } as React.CSSProperties}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${f.accent}18` }}>
                    <Icon className="h-5 w-5" style={{ color: f.accent }} />
                  </div>
                  <h3 className="mt-4 font-heading text-lg font-semibold text-white">{f.title}</h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-white/55">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── SECURITY + CTA ─────────────────────────────────── */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true }}
            className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-6 sm:flex sm:items-start sm:gap-4 sm:p-8"
          >
            <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-400" />
            <div>
              <h3 className="font-heading text-xl font-semibold text-white">Security & access you can trust</h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-white/65 sm:text-base">
                Role-based permissions keep staff in their lane while admins retain full visibility. Each restaurant portal stays isolated — no accidental cross-venue data.
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp} initial="hidden" whileInView="show"
            viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="relative mt-16 overflow-hidden rounded-2xl border border-white/10 px-6 py-14 text-center sm:px-12"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#FF6A47]/10 via-transparent to-[#3B82F6]/10" />
            <motion.div
              className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-[#FF6A47]/15 blur-[80px]"
              animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity }}
            />
            <h2 className="relative font-heading text-2xl font-bold text-white sm:text-3xl">
              Ready to run a smarter service?
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl font-sans text-white/60">
              Create your restaurant portal in minutes. Invite your team and go live with orders the same day.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="group gap-2 font-sans font-semibold bg-gradient-to-r from-[#FF6A47] to-[#ff4d2e] text-white shadow-lg shadow-[#FF6A47]/25 hover:brightness-110 transition-all" asChild>
                <Link to="/signup">
                  Create your portal
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 bg-transparent font-sans text-white hover:bg-white/8" asChild>
                <Link to="/contact">Talk to us</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </MarketingShell>
  );
}
