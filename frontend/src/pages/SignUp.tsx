import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  KeyRound,
  UserCheck,
  User,
  Mail,
  Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { authService } from '@/services/api';
import { AuthPageChrome } from '@/components/marketing/AuthPageChrome';
import type { RestaurantSignupResponse } from '@/types';

/* ─── Glow Input ─────────────────────────────────────────────────────────── */
function GlowInput({
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  icon: Icon,
  rightEl,
  required,
}: {
  id: string;
  type?: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ElementType;
  rightEl?: React.ReactNode;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="relative rounded-xl transition-all duration-300"
      style={{
        boxShadow: focused
          ? '0 0 0 2px #FF6A47, 0 0 20px rgba(255,106,71,0.25)'
          : '0 0 0 1px rgba(255,255,255,0.12)',
      }}
    >
      <Icon
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200"
        style={{ color: focused ? '#FF6A47' : 'rgba(255,255,255,0.35)' }}
      />
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        className="h-11 w-full rounded-xl bg-white/[0.06] pl-10 pr-10 font-sans text-sm text-white placeholder-white/30 outline-none transition-colors duration-200 hover:bg-white/[0.09]"
      />
      {rightEl && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
      )}
    </div>
  );
}

/* ─── Password Strength ──────────────────────────────────────────────────── */
function PasswordStrengthBar({ password }: { password: string }) {
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const label = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength] || '';
  const color = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-400'][strength] || '';

  if (!password) return null;
  return (
    <div className="space-y-1 pt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength ? color : 'bg-white/10'}`}
          />
        ))}
      </div>
      <p className="text-[10px] text-white/40">{label}</p>
    </div>
  );
}

/* ─── Success Widget ─────────────────────────────────────────────────────── */
function SuccessWidget({ data, onReset }: { data: RestaurantSignupResponse; onReset: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.restaurant_code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = data.restaurant_code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast.success('Portal code copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-md"
    >
      <div className="rounded-2xl border border-white/10 bg-[#111111]/80 shadow-2xl shadow-black/50 backdrop-blur-xl overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-500/10 to-[#3B82F6]/8 px-6 pt-8 pb-6 text-center border-b border-white/8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 ring-2 ring-emerald-500/30"
          >
            <Check className="h-8 w-8 text-emerald-400" />
          </motion.div>
          <h2 className="font-heading text-xl font-bold text-white">Your restaurant portal is ready! 🎉</h2>
          <p className="mt-2 text-sm text-white/50">{data.restaurant_name} is live. Save your portal code below.</p>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 font-sans text-xs uppercase tracking-wider text-white/50">
              <KeyRound className="h-3.5 w-3.5" /> Your Portal Code
            </Label>
            <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#FF6A47]/35 bg-[#FF6A47]/5 px-5 py-4">
              <code className="flex-1 text-center font-mono text-2xl font-bold tracking-widest text-white">
                {data.restaurant_code}
              </code>
              <Button
                type="button"
                size="sm"
                onClick={handleCopy}
                className={`shrink-0 gap-1.5 transition-all duration-300 ${copied ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-[#FF6A47] text-white hover:bg-[#ff5a38]'}`}
              >
                {copied ? <><Check className="h-4 w-4" />Copied!</> : <><Copy className="h-4 w-4" />Copy</>}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/8 p-4">
            <div className="flex items-center gap-2 text-sm">
              <UserCheck className="h-4 w-4 text-[#3B82F6]" />
              <span className="text-white/60">Admin username:</span>
              <code className="font-mono font-semibold text-white">{data.admin_user.username}</code>
            </div>
          </div>

          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-400/80">
            <strong className="text-amber-400">⚠️ Save your portal code</strong> — you'll need it every time you or your team signs in.
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">What's next?</p>
            <ul className="space-y-1.5 text-xs text-white/50">
              {['Sign in with your portal code + admin credentials', 'Go to Settings → Staff portals to invite your team', 'Set up your menu & start taking orders'].map((text, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF6A47]/15 text-[8px] font-bold text-[#FF6A47]">{i + 1}</span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="h-11 w-full rounded-xl bg-gradient-to-r from-[#FF6A47] to-[#ff4d2e] font-sans text-base font-semibold text-white shadow-lg shadow-[#FF6A47]/25 hover:brightness-110"
              asChild
            >
              <Link to="/signin">Sign in now <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" className="font-sans text-sm text-white/40 hover:text-white/70" onClick={onReset}>
              Create another portal
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── SignUp ─────────────────────────────────────────────────────────────── */
export default function SignUp() {
  const [signupForm, setSignupForm] = useState({
    restaurant_name: '',
    admin_full_name: '',
    admin_username: '',
    admin_email: '',
    password: '',
  });
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [signupResult, setSignupResult] = useState<RestaurantSignupResponse | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSignup(true);
    try {
      const response = await authService.signupRestaurant({
        ...signupForm,
        admin_email: signupForm.admin_email.trim() || undefined,
      });
      setSignupResult(response);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Signup failed');
    } finally {
      setIsLoadingSignup(false);
    }
  };

  const handleReset = () => {
    setSignupResult(null);
    setSignupForm({ restaurant_name: '', admin_full_name: '', admin_username: '', admin_email: '', password: '' });
  };

  return (
    <AuthPageChrome>
      <AnimatePresence mode="wait">
        {signupResult ? (
          <SuccessWidget key="success" data={signupResult} onReset={handleReset} />
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-2xl"
          >
            <div className="rounded-2xl border border-white/10 bg-[#111111]/80 shadow-2xl shadow-black/50 backdrop-blur-xl">
              {/* Header */}
              <div className="border-b border-white/8 px-6 pt-7 pb-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6A47]/20 to-[#FF6A47]/5 ring-1 ring-[#FF6A47]/30">
                  <Sparkles className="h-6 w-6 text-[#FF6A47]" />
                </div>
                <h1 className="font-heading text-2xl font-bold text-white">Create your restaurant portal</h1>
                <p className="mt-1 font-sans text-sm text-white/50">
                  You'll get a unique portal code and admin login — then invite your team
                </p>
              </div>

              <div className="p-6">
                <form onSubmit={handleSignup} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Restaurant name */}
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="restaurant_name" className="flex items-center gap-1.5 font-sans text-sm text-white/70">
                      <Building2 className="h-3.5 w-3.5" /> Restaurant name
                    </Label>
                    <GlowInput
                      id="restaurant_name"
                      placeholder="Your restaurant"
                      value={signupForm.restaurant_name}
                      onChange={(e) => setSignupForm({ ...signupForm, restaurant_name: e.target.value })}
                      icon={Building2}
                      required
                    />
                    <p className="text-[10px] text-white/30">A unique portal code will be generated from this name</p>
                  </div>

                  {/* Admin full name */}
                  <div className="space-y-2">
                    <Label htmlFor="admin_full_name" className="font-sans text-sm text-white/70">Admin full name</Label>
                    <GlowInput
                      id="admin_full_name"
                      placeholder="e.g. Ahmed Khan"
                      value={signupForm.admin_full_name}
                      onChange={(e) => setSignupForm({ ...signupForm, admin_full_name: e.target.value })}
                      icon={User}
                      required
                    />
                  </div>

                  {/* Admin username */}
                  <div className="space-y-2">
                    <Label htmlFor="admin_username" className="font-sans text-sm text-white/70">Admin username</Label>
                    <GlowInput
                      id="admin_username"
                      placeholder="owner_admin"
                      value={signupForm.admin_username}
                      onChange={(e) => setSignupForm({ ...signupForm, admin_username: e.target.value })}
                      icon={User}
                      required
                    />
                    <p className="text-[10px] text-white/30">You'll use this to sign in</p>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="admin_email" className="font-sans text-sm text-white/70">
                      Admin email <span className="text-white/30">(optional)</span>
                    </Label>
                    <GlowInput
                      id="admin_email"
                      type="email"
                      placeholder="you@example.com"
                      value={signupForm.admin_email}
                      onChange={(e) => setSignupForm({ ...signupForm, admin_email: e.target.value })}
                      icon={Mail}
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="signup_password" className="font-sans text-sm text-white/70">Password</Label>
                    <GlowInput
                      id="signup_password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      icon={Lock}
                      required
                      rightEl={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-white/35 transition-colors hover:text-white/70"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                    <PasswordStrengthBar password={signupForm.password} />
                  </div>

                  {/* Submit */}
                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      className="group mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-[#FF6A47] to-[#ff4d2e] font-sans text-base font-semibold text-white shadow-lg shadow-[#FF6A47]/25 transition-all duration-300 hover:brightness-110 disabled:opacity-60"
                      disabled={isLoadingSignup}
                    >
                      {isLoadingSignup ? (
                        <><Loader2 className="h-5 w-5 animate-spin" /> Creating portal…</>
                      ) : (
                        <>Create portal <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" /></>
                      )}
                    </Button>
                  </div>
                </form>

                <p className="mt-5 text-center font-sans text-sm text-white/45">
                  Already have a portal?{' '}
                  <Link to="/signin" className="font-semibold text-[#FF6A47] transition-colors hover:text-[#ff8a70]">
                    Sign in
                  </Link>
                </p>
                <p className="mt-3 text-center">
                  <Link to="/" className="font-sans text-xs text-white/30 transition-colors hover:text-white/60">
                    ← Back to homepage
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthPageChrome>
  );
}
