import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingShell } from '@/components/marketing/MarketingShell';

const tiers = [
  {
    name: 'Starter',
    price: 'Free',
    detail: 'for early venues validating workflows',
    highlight: false,
    features: ['1 restaurant portal', 'Core ordering & kitchen', 'Basic reporting', 'Email support'],
  },
  {
    name: 'Growth',
    price: 'Custom',
    detail: 'for busy teams that need depth',
    highlight: true,
    features: [
      'Everything in Starter',
      'Advanced reports & exports',
      'Staff portals & roles',
      'Inventory signals',
      'Priority support',
    ],
  },
  {
    name: 'Enterprise',
    price: 'Let’s talk',
    detail: 'for groups, franchises, and integrations',
    highlight: false,
    features: ['Multi-location strategy', 'Custom AI workflows', 'SSO & security review', 'Dedicated success'],
  },
];

export default function Pricing() {
  return (
    <MarketingShell>
      <div className="border-b border-white/10 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="font-heading text-4xl font-bold text-white sm:text-5xl">
            Simple <span className="text-[#FF6A47]">pricing</span>, serious ops
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-sans text-lg text-white/70">
            Start free, prove the workflow with your crew, then scale with the capabilities your group needs.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                tier.highlight
                  ? 'border-[#FF6A47]/50 bg-gradient-to-b from-[#FF6A47]/10 to-[#1A1A1A] shadow-lg shadow-[#FF6A47]/10'
                  : 'border-white/10 bg-[#1A1A1A]'
              }`}
            >
              {tier.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FF6A47] px-3 py-0.5 font-sans text-xs font-semibold text-white">
                  Popular
                </span>
              )}
              <h2 className="font-heading text-xl font-bold text-white">{tier.name}</h2>
              <p className="mt-2 font-heading text-3xl font-bold text-white">{tier.price}</p>
              <p className="mt-1 font-sans text-sm text-white/55">{tier.detail}</p>
              <ul className="mt-8 flex-1 space-y-3 font-sans text-sm text-white/75">
                {tier.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="h-4 w-4 shrink-0 text-[#3B82F6]" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className={`mt-8 w-full font-sans font-semibold ${
                  tier.highlight
                    ? 'bg-[#FF6A47] text-white hover:bg-[#ff5a38]'
                    : 'border border-white/20 bg-transparent text-white hover:bg-white/10'
                }`}
                variant={tier.highlight ? 'default' : 'outline'}
                asChild
              >
                <Link to={tier.name === 'Enterprise' ? '/contact' : '/signup'}>
                  {tier.name === 'Enterprise' ? 'Contact sales' : 'Start now'}
                </Link>
              </Button>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center font-sans text-xs text-white/45">
          Listed tiers are illustrative for this product experience; commercial terms can be finalized with your team.
        </p>
      </div>
    </MarketingShell>
  );
}
