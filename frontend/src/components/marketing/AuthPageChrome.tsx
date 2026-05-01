import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MarketingNav } from './MarketingNav';
import { ChefHat, BarChart3, Users, Zap, ShieldCheck, Sparkles } from 'lucide-react';

const features = [
  {
    icon: ChefHat,
    title: 'Kitchen to Cashier in Seconds',
    desc: 'Orders flow from table to kitchen to checkout — seamlessly.',
  },
  {
    icon: BarChart3,
    title: 'AI-Powered Insights',
    desc: 'Predict inventory needs, spot trends, and optimize your menu.',
  },
  {
    icon: Users,
    title: 'Team-Ready Roles',
    desc: 'Admin, Manager, Waiter, Chef, Cashier — each gets their own workspace.',
  },
  {
    icon: Zap,
    title: 'Go Live in Minutes',
    desc: 'Create your portal, invite your team, start taking orders today.',
  },
];

export function AuthPageChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1A1A1A]">
      {/* Animated background orbs */}
      <div className="pointer-events-none fixed inset-0">
        <motion.div
          className="absolute -right-32 -top-40 h-[500px] w-[500px] rounded-full bg-[#FF6A47]/15 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-32 h-[500px] w-[500px] rounded-full bg-[#3B82F6]/12 blur-[120px]"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.35, 0.2, 0.35] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-[#8B5CF6]/8 blur-[100px]"
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <MarketingNav />

        <div className="flex flex-1">
          {/* LEFT PANEL — Feature showcase (hidden on mobile) */}
          <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] flex-col justify-center px-10 xl:px-16">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Brand badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#FF6A47]">
                <Sparkles className="h-3.5 w-3.5" />
                Servify AI
              </div>

              <h2 className="mt-6 font-heading text-3xl font-bold leading-tight text-white xl:text-4xl">
                Your Restaurant,{' '}
                <span className="bg-gradient-to-r from-[#FF6A47] to-[#FF8F73] bg-clip-text text-transparent">
                  Supercharged
                </span>
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-white/55 max-w-md">
                One portal code. Full team. AI insights. Everything a modern restaurant needs — from first order to closing report.
              </p>

              {/* Feature list */}
              <div className="mt-10 space-y-5">
                {features.map((feature, i) => {
                  const Icon = feature.icon;
                  return (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
                      className="flex items-start gap-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] border border-white/10">
                        <Icon className="h-5 w-5 text-[#FF6A47]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{feature.title}</p>
                        <p className="mt-0.5 text-xs text-white/50">{feature.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Trust badge */}
              <div className="mt-10 flex items-center gap-2 text-xs text-white/40">
                <ShieldCheck className="h-4 w-4 text-emerald-400/70" />
                <span>Encrypted portals · Isolated data per restaurant</span>
              </div>
            </motion.div>
          </div>

          {/* RIGHT PANEL — Form */}
          <div className="flex flex-1 items-center justify-center px-4 py-10">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
