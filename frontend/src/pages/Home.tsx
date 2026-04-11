import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Building2,
  ChartNoAxesCombined,
  ClipboardList,
  Cpu,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingShell } from '@/components/marketing/MarketingShell';

const features = [
  {
    title: 'AI that runs operations',
    description:
      'Automate routine decisions, spot bottlenecks early, and get plain-language guidance tailored to your floor and kitchen.',
    icon: Bot,
    accent: 'text-[#3B82F6]',
  },
  {
    title: 'Multi-restaurant isolation',
    description:
      'Each venue gets its own portal code, data, menu, and staff — ideal for groups and white-label operators.',
    icon: Building2,
    accent: 'text-[#FF6A47]',
  },
  {
    title: 'Role-based workspace',
    description:
      'Waiters, chefs, cashiers, and managers see exactly what they need — fast handoffs, fewer mistakes.',
    icon: Users,
    accent: 'text-[#3B82F6]',
  },
  {
    title: 'Live kitchen & billing',
    description:
      'Orders flow from table to kitchen to checkout with clear status, so guests wait less and turns improve.',
    icon: ClipboardList,
    accent: 'text-[#FF6A47]',
  },
  {
    title: 'Inventory & waste control',
    description:
      'Track stock and usage so you trim waste and protect margin without spreadsheet chaos.',
    icon: Zap,
    accent: 'text-[#3B82F6]',
  },
  {
    title: 'Growth analytics',
    description:
      'Dashboards and reports highlight what sells, when you peak, and where revenue leaks.',
    icon: ChartNoAxesCombined,
    accent: 'text-[#FF6A47]',
  },
];

const stats = [
  { label: 'Operations in one stack', value: 'Orders → Kitchen → Pay' },
  { label: 'Built for teams', value: 'Admin, Manager, Floor, Chef' },
  { label: 'AI-ready', value: 'Insights on demand' },
];

export default function Home() {
  return (
    <MarketingShell>
      <section className="relative overflow-hidden border-b border-white/10">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255,106,71,0.35), transparent), radial-gradient(ellipse 60% 40% at 100% 50%, rgba(59,130,246,0.2), transparent)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-[#FF6A47]">
              <Sparkles className="h-3.5 w-3.5" />
              Smart Service. Smarter Restaurants.
            </div>
            <h1 className="mt-8 font-heading text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              AI That Runs Your{' '}
              <span className="text-[#FF6A47]">Restaurant</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl font-sans text-lg leading-relaxed text-white/70">
              Automate operations, reduce waste, delight customers, and grow profits — all with AI. Servify AI is the
              modern control room for hospitality teams.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-12 px-8 font-sans text-base font-semibold bg-[#FF6A47] text-white shadow-lg shadow-[#FF6A47]/30 hover:bg-[#ff5a38]"
                asChild
              >
                <Link to="/signup">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 border-white/25 bg-transparent px-8 font-sans text-base text-white hover:bg-white/10 hover:text-white"
                asChild
              >
                <Link to="/features">Explore features</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mx-auto mt-16 max-w-5xl"
          >
            <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent p-1 shadow-2xl shadow-black/40">
              <div className="rounded-xl bg-[#0f0f0f] p-6 sm:p-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF6A47]/15 text-[#FF6A47]">
                      <Cpu className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-heading text-lg font-semibold text-white">Command center preview</p>
                      <p className="mt-1 font-sans text-sm text-white/60">
                        Dashboards, AI insights, orders, and reports — tuned for dark, high-contrast work environments.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 font-sans text-xs text-white/50">
                    <span className="rounded-full border border-[#3B82F6]/40 bg-[#3B82F6]/10 px-3 py-1 text-[#93C5FD]">
                      Trust · Secure portals
                    </span>
                    <span className="rounded-full border border-[#FF6A47]/40 bg-[#FF6A47]/10 px-3 py-1 text-[#FFAB9A]">
                      Action · Real-time ops
                    </span>
                  </div>
                </div>
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  {stats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-left"
                    >
                      <p className="font-heading text-sm font-semibold text-[#FF6A47]">{item.value}</p>
                      <p className="mt-1 font-sans text-xs text-white/55">{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#141414] py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold text-white sm:text-4xl">
              Everything your team needs to <span className="text-[#3B82F6]">scale</span>
            </h2>
            <p className="mt-4 font-sans text-white/65">
              From first seat to final check — one platform, clear roles, and AI where it actually saves time.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-[#1A1A1A] p-6 transition-colors hover:border-[#FF6A47]/30"
                >
                  <Icon className={`h-8 w-8 ${feature.accent}`} />
                  <h3 className="mt-4 font-heading text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 font-sans text-sm leading-relaxed text-white/60">{feature.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] p-6 sm:flex sm:items-start sm:gap-4 sm:p-8">
            <ShieldCheck className="h-8 w-8 shrink-0 text-emerald-400" />
            <div>
              <h3 className="font-heading text-xl font-semibold text-white">Security & access you can trust</h3>
              <p className="mt-2 font-sans text-sm leading-relaxed text-white/70 sm:text-base">
                Role-based permissions keep staff in their lane while admins and managers retain full visibility. Each
                restaurant portal stays isolated — no accidental cross-venue data.
              </p>
            </div>
          </div>

          <div className="mt-16 rounded-2xl border border-white/10 bg-gradient-to-br from-[#FF6A47]/10 via-transparent to-[#3B82F6]/10 px-6 py-12 text-center sm:px-12">
            <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
              Ready to run a smarter service?
            </h2>
            <p className="mx-auto mt-3 max-w-xl font-sans text-white/65">
              Create your restaurant portal in minutes. Invite your team and go live with orders the same day.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="font-sans font-semibold bg-[#FF6A47] text-white hover:bg-[#ff5a38]"
                asChild
              >
                <Link to="/signup">Create your portal</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/25 bg-transparent font-sans text-white hover:bg-white/10"
                asChild
              >
                <Link to="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
