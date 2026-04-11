import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { MarketingNav } from './MarketingNav';

export function AuthPageChrome({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1A1A1A]">
      <div className="pointer-events-none fixed inset-0">
        <motion.div
          className="absolute -right-32 -top-40 h-96 w-96 rounded-full bg-[#FF6A47]/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.35, 0.5, 0.35] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-[#3B82F6]/15 blur-3xl"
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.45, 0.28, 0.45] }}
          transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        <MarketingNav />
        <div className="flex flex-1 items-center justify-center px-4 py-10">{children}</div>
      </div>
    </div>
  );
}
