import { MarketingShell } from '@/components/marketing/MarketingShell';

export default function Terms() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h1 className="font-heading text-4xl font-bold text-white">Terms of service</h1>
        <p className="mt-4 font-sans text-sm text-white/55">Last updated: April 11, 2026</p>
        <div className="prose prose-invert mt-10 max-w-none font-sans text-sm leading-relaxed text-white/75">
          <p>
            By accessing Servify AI, you agree to use the product responsibly and only for lawful restaurant operations.
            These terms are a placeholder summary for development environments.
          </p>
          <h2 className="mt-8 font-heading text-lg font-semibold text-white">Accounts</h2>
          <p className="mt-2">
            You are responsible for activity under your portal codes and staff accounts. Do not share administrative
            credentials outside your organization.
          </p>
          <h2 className="mt-8 font-heading text-lg font-semibold text-white">Service changes</h2>
          <p className="mt-2">
            Features may evolve during beta or early access periods. We may update this page as the commercial offering
            matures.
          </p>
          <h2 className="mt-8 font-heading text-lg font-semibold text-white">Disclaimer</h2>
          <p className="mt-2">
            The software is provided as-is during evaluation. Replace this draft with jurisdiction-appropriate legal text
            before charging customers.
          </p>
        </div>
      </div>
    </MarketingShell>
  );
}
