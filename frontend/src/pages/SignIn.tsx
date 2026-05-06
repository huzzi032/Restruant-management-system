import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { KeyRound, Loader2, Lock, User, Eye, EyeOff, Info, ArrowRight, ClipboardPaste } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthPageChrome } from '@/components/marketing/AuthPageChrome';

const steps = [
  { num: '1', label: 'Portal code (optional)' },
  { num: '2', label: 'Enter credentials' },
  { num: '3', label: 'Access workspace' },
];

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

export default function SignIn() {
  const [credentials, setCredentials] = useState({ restaurant_code: '', username: '', password: '' });
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingLogin(true);
    try {
      await login(credentials);
    } catch {
      // Error surfaced in auth context
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handlePasteCode = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setCredentials({ ...credentials, restaurant_code: text.trim() });
    } catch {
      // Clipboard not available
    }
  };

  return (
    <AuthPageChrome>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        {/* Stepper */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-6 flex items-center justify-center gap-2"
        >
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6A47]/20 text-[10px] font-bold text-[#FF6A47] ring-1 ring-[#FF6A47]/30">
                  {step.num}
                </span>
                <span className="hidden text-[11px] text-white/50 sm:inline">{step.label}</span>
              </div>
              {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-white/20" />}
            </div>
          ))}
        </motion.div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-[#111111]/80 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {/* Header */}
          <div className="border-b border-white/8 px-6 pt-7 pb-5 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6A47]/20 to-[#FF6A47]/5 ring-1 ring-[#FF6A47]/30">
              <KeyRound className="h-5 w-5 text-[#FF6A47]" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white">Welcome back</h1>
            <p className="mt-1 font-sans text-sm text-white/50">
              Sign in with your portal code and staff credentials
            </p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Portal code - optional */}
              <div className="space-y-2">
                <Label htmlFor="restaurant_code" className="flex items-center gap-1.5 font-sans text-sm text-white/70">
                  Portal code
                  <span className="text-[10px] text-white/35 font-normal">(optional)</span>
                  <span className="group relative cursor-help">
                    <Info className="h-3.5 w-3.5 text-[#3B82F6]/60" />
                    <span className="absolute bottom-full left-1/2 z-50 mb-2 hidden w-56 -translate-x-1/2 rounded-lg bg-[#0a0a0a] px-3 py-2 text-center text-[11px] text-white/80 shadow-xl ring-1 ring-white/10 group-hover:block">
                      Required only for staff accounts. Admins can leave this blank and log in with username &amp; password only.
                    </span>
                  </span>
                </Label>
                <GlowInput
                  id="restaurant_code"
                  placeholder="e.g. hadiq-4f3a  (leave blank if admin)"
                  value={credentials.restaurant_code}
                  onChange={(e) => setCredentials({ ...credentials, restaurant_code: e.target.value })}
                  icon={KeyRound}
                  rightEl={
                    <button
                      type="button"
                      onClick={handlePasteCode}
                      className="text-[#3B82F6]/60 transition-colors hover:text-[#3B82F6]"
                      title="Paste from clipboard"
                    >
                      <ClipboardPaste className="h-4 w-4" />
                    </button>
                  }
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="font-sans text-sm text-white/70">Username</Label>
                <GlowInput
                  id="username"
                  placeholder="Your username"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  icon={User}
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="font-sans text-sm text-white/70">Password</Label>
                <GlowInput
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
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
              </div>

              {/* Submit */}
              <Button
                type="submit"
                className="group relative mt-2 h-11 w-full overflow-hidden rounded-xl bg-gradient-to-r from-[#FF6A47] to-[#ff4d2e] font-sans text-base font-semibold text-white shadow-lg shadow-[#FF6A47]/25 transition-all duration-300 hover:shadow-[#FF6A47]/40 hover:brightness-110 disabled:opacity-60"
                disabled={isLoadingLogin}
              >
                {isLoadingLogin ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </Button>

              {/* Info banner */}
              <div className="rounded-xl border border-[#3B82F6]/20 bg-[#3B82F6]/8 p-3 font-sans text-xs text-[#93C5FD]">
                <strong className="text-[#60A5FA]">Admin?</strong> Leave portal code blank — just use your username &amp; password.{' '}
                <strong className="text-[#60A5FA]">Staff?</strong> Ask your admin for the portal code and use your assigned credentials.
              </div>
            </form>

            <p className="mt-5 text-center font-sans text-sm text-white/45">
              New restaurant?{' '}
              <Link to="/signup" className="font-semibold text-[#FF6A47] transition-colors hover:text-[#ff8a70]">
                Create a portal
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
    </AuthPageChrome>
  );
}
