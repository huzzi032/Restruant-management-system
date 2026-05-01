import { MarketingShell } from '@/components/marketing/MarketingShell';

export default function Privacy() {
  return (
    <MarketingShell>
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <h1 className="font-heading text-4xl font-bold text-white">Privacy policy</h1>
        <p className="mt-4 font-sans text-sm text-white/55">Last updated: April 11, 2026</p>
        <div className="prose prose-invert mt-10 max-w-none font-sans text-sm leading-relaxed text-white/75">
          <p>
            Servify AI (&quot;we&quot;, &quot;our&quot;) provides restaurant management software. This page summarizes how
            we treat information in the product experience you are using.
          </p>
          <h2 className="mt-8 font-heading text-lg font-semibold text-white">Data you provide</h2>
          <p className="mt-2">
            When you create a portal or use the app, you may submit business data such as restaurant details, staff
            accounts, menus, orders, and operational notes. We use this information to operate the service you requested.
          </p>
          <h2 className="mt-8 font-heading text-lg font-semibold text-white">Security</h2>
          <p className="mt-2">
            We design the platform around tenant isolation and role-based access. You should protect staff credentials
            and rotate passwords according to your own policies.
          </p>
          <h2 className="mt-8 font-heading text-lg font-semibold text-white">Contact</h2>
          <p className="mt-2">
            For privacy questions, reach us through the Contact page. Replace this draft with counsel-approved language
            before production launch.
          </p>
        </div>
      </div>
    </MarketingShell>
  );
}
