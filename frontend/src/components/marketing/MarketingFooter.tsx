import { Link } from 'react-router-dom';
import { ServifyLogo } from './ServifyLogo';

export function MarketingFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#141414] text-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <ServifyLogo size="sm" />
            <p className="font-sans text-sm leading-relaxed text-white/65">
              Smart service. Smarter restaurants. AI-powered operations for modern hospitality teams.
            </p>
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-white">Product</p>
            <ul className="mt-4 space-y-2 font-sans text-sm text-white/70">
              <li>
                <Link to="/features" className="hover:text-[#FF6A47] transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-[#FF6A47] transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-[#FF6A47] transition-colors">
                  Create portal
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-white">Company</p>
            <ul className="mt-4 space-y-2 font-sans text-sm text-white/70">
              <li>
                <Link to="/contact" className="hover:text-[#FF6A47] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <a
                  href="https://devhaki.com"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-[#3B82F6] transition-colors"
                >
                  devhaki.com
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-heading text-sm font-semibold text-white">Legal</p>
            <ul className="mt-4 space-y-2 font-sans text-sm text-white/70">
              <li>
                <Link to="/privacy" className="hover:text-[#FF6A47] transition-colors">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-[#FF6A47] transition-colors">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-white/10 pt-8 font-sans text-xs text-white/45">
          © {new Date().getFullYear()} Servify AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
