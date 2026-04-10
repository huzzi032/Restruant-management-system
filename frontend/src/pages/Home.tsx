import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Bot, Building2, ChartNoAxesCombined, ClipboardList, ReceiptText, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    title: 'Multi-Restaurant Isolation',
    description: 'Each restaurant gets a unique portal code with fully separated data, users, menu, tables, and orders.',
    icon: Building2,
  },
  {
    title: 'Smart Daily Operations',
    description: 'Order flow, kitchen sync, billing, and table management in one responsive workspace for every role.',
    icon: ClipboardList,
  },
  {
    title: 'Servify AI Insights',
    description: 'Get instant business signals on demand, pricing opportunities, and service bottlenecks before rush hour.',
    icon: Bot,
  },
  {
    title: 'Growth Analytics',
    description: 'Track sales trends, menu winners, and operational performance with clear reporting dashboards.',
    icon: ChartNoAxesCombined,
  },
];

const tour = [
  {
    step: '1. Create Restaurant Portal',
    detail: 'Use Login > Restaurant Signup to create your own portal code and admin account.',
  },
  {
    step: '2. Staff Portals',
    detail: 'Admin goes to Settings > Staff Portals to create waiter, chef, cashier, and manager accounts.',
  },
  {
    step: '3. Daily Operations',
    detail: 'Waiter takes orders, Kitchen handles status flow, Cashier finalizes billing, Manager monitors reports.',
  },
  {
    step: '4. Intelligence & Control',
    detail: 'Use dashboards, reports, and Servify AI insights to improve service and profitability.',
  },
];

const modules = [
  { title: 'Order Taking', icon: ClipboardList, where: '/orders', forRole: 'Waiter, Admin, Manager' },
  { title: 'Kitchen Display', icon: ReceiptText, where: '/kitchen', forRole: 'Chef, Admin, Manager' },
  { title: 'Billing', icon: ChartNoAxesCombined, where: '/billing', forRole: 'Cashier, Admin, Manager' },
  { title: 'Staff Management', icon: Users, where: '/settings', forRole: 'Admin (staff portals)' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#f59e0b22_0,transparent_40%),radial-gradient(circle_at_80%_20%,#14b8a622_0,transparent_35%),linear-gradient(180deg,#fffaf3_0%,#ffffff_45%,#f8fafc_100%)] text-slate-900 flex flex-col">
      <section className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24 flex-1">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="rounded-3xl border border-amber-100 bg-white/80 backdrop-blur-sm shadow-xl p-6 sm:p-10 lg:p-14">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-900 px-4 py-1.5 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="h-3.5 w-3.5" />
            Servify AI Platform
          </div>

          <h1 className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
            Run every restaurant branch with its own intelligent system.
          </h1>
          <p className="mt-5 max-w-3xl text-base sm:text-lg text-slate-600 leading-relaxed">
            Servify AI helps restaurants launch their own secure portal, onboard staff, manage orders, menus, billing, and operations without data overlap.
            Whether you run one outlet or many clients, each restaurant works independently with zero conflict.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold">
              <Link to="/login">
                Login / Signup
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-slate-300">
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-8 sm:mt-10">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                className="rounded-2xl border bg-white/90 p-5 sm:p-6 hover:shadow-lg transition-shadow"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-300 grid place-items-center">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-700 mt-0.5" />
          <p className="text-sm sm:text-base text-emerald-900">
            Built for role-based access: staff only sees what they are allowed to access, while admin and manager keep full operational control.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border bg-white/90 p-6">
            <h2 className="text-2xl font-bold">How To Use Servify AI</h2>
            <div className="mt-4 space-y-3">
              {tour.map((item) => (
                <div key={item.step} className="rounded-xl border bg-slate-50 p-4">
                  <p className="font-semibold text-slate-900">{item.step}</p>
                  <p className="text-sm text-slate-600 mt-1">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border bg-white/90 p-6">
            <h2 className="text-2xl font-bold">Feature Tour By Module</h2>
            <div className="mt-4 space-y-3">
              {modules.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-xl border bg-slate-50 p-4 flex gap-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-900 text-amber-300 grid place-items-center shrink-0">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-xs text-slate-600 mt-1">Where: {item.where}</p>
                      <p className="text-xs text-slate-600">Access: {item.forRole}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-slate-950 text-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold">Servify AI</p>
            <p className="text-slate-300 mt-1">Multi-restaurant management platform</p>
          </div>
          <div>
            <p className="font-semibold">Team</p>
            <p className="text-slate-300 mt-1">Founder: Abdullah</p>
            <p className="text-slate-300">Co-Founder: Huzaifa Tahir</p>
          </div>
          <div>
            <p className="font-semibold">Links</p>
            <a href="https://devhaki.com" className="text-sky-300 hover:text-sky-200" target="_blank" rel="noreferrer">devhaki.com</a>
            <p className="mt-1"><Link to="/contact" className="text-sky-300 hover:text-sky-200">Contact Page</Link></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
