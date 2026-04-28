import { Link } from 'react-router-dom';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { authService } from '@/services/api';
import { AuthPageChrome } from '@/components/marketing/AuthPageChrome';
import type { RestaurantSignupResponse } from '@/types';

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
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= strength ? color : 'bg-[#1A1A1A]/10'
            }`}
          />
        ))}
      </div>
      <p className="text-[10px] text-[#1A1A1A]/50">{label}</p>
    </div>
  );
}

function SuccessWidget({
  data,
  onReset,
}: {
  data: RestaurantSignupResponse;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.restaurant_code);
      setCopied(true);
      toast.success('Portal code copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = data.restaurant_code;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      toast.success('Portal code copied!');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full max-w-md"
    >
      <Card className="border border-white/10 bg-[#F5F5F5] text-[#1A1A1A] shadow-2xl shadow-black/30 overflow-hidden">
        {/* Success header with gradient */}
        <div className="bg-gradient-to-br from-emerald-500/15 to-[#3B82F6]/10 px-6 pt-8 pb-6 text-center border-b border-[#1A1A1A]/10">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 border-2 border-emerald-500/30"
          >
            <Check className="h-8 w-8 text-emerald-500" />
          </motion.div>
          <h2 className="font-heading text-xl font-bold text-[#1A1A1A]">
            Your restaurant portal is ready! 🎉
          </h2>
          <p className="mt-2 text-sm text-[#1A1A1A]/60">
            {data.restaurant_name} is live. Save your portal code below.
          </p>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* Portal Code Widget */}
          <div className="space-y-2">
            <Label className="font-sans text-xs text-[#1A1A1A]/60 uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound className="h-3.5 w-3.5" />
              Your Portal Code
            </Label>
            <div className="relative">
              <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-[#FF6A47]/40 bg-[#FF6A47]/5 px-5 py-4">
                <code className="flex-1 text-center font-mono text-2xl font-bold tracking-widest text-[#1A1A1A]">
                  {data.restaurant_code}
                </code>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCopy}
                  className={`shrink-0 gap-1.5 transition-all duration-300 ${
                    copied
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                      : 'bg-[#FF6A47] text-white hover:bg-[#ff5a38]'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Admin info */}
          <div className="rounded-lg bg-[#3B82F6]/5 border border-[#3B82F6]/15 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <UserCheck className="h-4 w-4 text-[#3B82F6]" />
              <span className="text-[#1A1A1A]/70">Admin username:</span>
              <code className="font-mono font-semibold text-[#1A1A1A]">
                {data.admin_user.username}
              </code>
            </div>
          </div>

          {/* Important notice */}
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-xs text-amber-700">
            <strong>⚠️ Save your portal code</strong> — you'll need it every time you or your team signs in.
            Share it only with people you want to give access.
          </div>

          {/* What's next */}
          <div className="space-y-2 pt-1">
            <p className="text-xs font-semibold text-[#1A1A1A]/50 uppercase tracking-wider">What's next?</p>
            <ul className="space-y-1.5 text-xs text-[#1A1A1A]/60">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF6A47]/10 text-[8px] font-bold text-[#FF6A47]">1</span>
                Sign in with your portal code + admin credentials
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF6A47]/10 text-[8px] font-bold text-[#FF6A47]">2</span>
                Go to Settings → Staff portals to invite your team
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF6A47]/10 text-[8px] font-bold text-[#FF6A47]">3</span>
                Set up your menu & start taking orders
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="h-11 w-full font-sans text-base font-semibold bg-[#FF6A47] text-white hover:bg-[#ff5a38] shadow-lg shadow-[#FF6A47]/20"
              asChild
            >
              <Link to="/signin">
                Sign in now
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              className="font-sans text-sm text-[#1A1A1A]/50"
              onClick={onReset}
            >
              Create another portal
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

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
    setSignupForm({
      restaurant_name: '',
      admin_full_name: '',
      admin_username: '',
      admin_email: '',
      password: '',
    });
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
            <Card className="border border-white/10 bg-[#F5F5F5] text-[#1A1A1A] shadow-2xl shadow-black/30">
              <CardHeader className="space-y-1 text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6A47]/10">
                  <Sparkles className="h-6 w-6 text-[#FF6A47]" />
                </div>
                <CardTitle className="font-heading text-2xl font-bold text-[#1A1A1A]">Create your restaurant portal</CardTitle>
                <CardDescription className="font-sans text-[#1A1A1A]/65">
                  You'll get a unique portal code and admin login — then invite your team
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignup} className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {/* Restaurant name — full width */}
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="restaurant_name" className="font-sans flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 text-[#1A1A1A]/45" />
                      Restaurant name
                    </Label>
                    <Input
                      id="restaurant_name"
                      value={signupForm.restaurant_name}
                      onChange={(e) => setSignupForm({ ...signupForm, restaurant_name: e.target.value })}
                      placeholder="Your restaurant"
                      className="h-11 border-[#1A1A1A]/15 bg-white font-sans"
                      required
                    />
                    <p className="text-[10px] text-[#1A1A1A]/40">A unique portal code will be generated from this name</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_full_name" className="font-sans">
                      Admin full name
                    </Label>
                    <Input
                      id="admin_full_name"
                      value={signupForm.admin_full_name}
                      onChange={(e) => setSignupForm({ ...signupForm, admin_full_name: e.target.value })}
                      placeholder="e.g. Ahmed Khan"
                      className="h-11 border-[#1A1A1A]/15 bg-white font-sans"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_username" className="font-sans">
                      Admin username
                    </Label>
                    <Input
                      id="admin_username"
                      value={signupForm.admin_username}
                      onChange={(e) => setSignupForm({ ...signupForm, admin_username: e.target.value })}
                      placeholder="owner_admin"
                      className="h-11 border-[#1A1A1A]/15 bg-white font-sans"
                      required
                    />
                    <p className="text-[10px] text-[#1A1A1A]/40">You'll use this to sign in</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_email" className="font-sans">
                      Admin email <span className="text-[#1A1A1A]/35">(optional)</span>
                    </Label>
                    <Input
                      id="admin_email"
                      type="email"
                      value={signupForm.admin_email}
                      onChange={(e) => setSignupForm({ ...signupForm, admin_email: e.target.value })}
                      placeholder="you@example.com"
                      className="h-11 border-[#1A1A1A]/15 bg-white font-sans"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup_password" className="font-sans">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup_password"
                        type={showPassword ? 'text' : 'password'}
                        value={signupForm.password}
                        onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                        placeholder="Min 6 characters"
                        className="h-11 border-[#1A1A1A]/15 bg-white pr-10 font-sans"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40 hover:text-[#1A1A1A]/70 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <PasswordStrengthBar password={signupForm.password} />
                  </div>

                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      className="mt-2 h-11 w-full font-sans text-base font-semibold bg-[#FF6A47] text-white hover:bg-[#ff5a38] shadow-lg shadow-[#FF6A47]/20"
                      disabled={isLoadingSignup}
                    >
                      {isLoadingSignup ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Creating portal…
                        </>
                      ) : (
                        <>
                          Create portal
                          <ArrowRight className="h-4 w-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>

                <p className="mt-6 text-center font-sans text-sm text-[#1A1A1A]/65">
                  Already have a portal?{' '}
                  <Link to="/signin" className="font-semibold text-[#3B82F6] hover:underline">
                    Sign in
                  </Link>
                </p>
                <p className="mt-3 text-center">
                  <Button variant="link" className="font-sans text-[#1A1A1A]/55" asChild>
                    <Link to="/">Back to homepage</Link>
                  </Button>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthPageChrome>
  );
}
