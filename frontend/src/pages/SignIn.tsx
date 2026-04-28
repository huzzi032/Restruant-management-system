import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, Loader2, Lock, User, Eye, EyeOff, Info, ArrowRight, ClipboardPaste } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthPageChrome } from '@/components/marketing/AuthPageChrome';

const steps = [
  { num: '1', label: 'Paste your portal code' },
  { num: '2', label: 'Enter staff credentials' },
  { num: '3', label: 'Access your workspace' },
];

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
      if (text) {
        setCredentials({ ...credentials, restaurant_code: text.trim() });
      }
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
        {/* How it works stepper — mobile-friendly */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-6 flex items-center justify-center gap-2"
        >
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#FF6A47]/15 text-[10px] font-bold text-[#FF6A47]">
                  {step.num}
                </span>
                <span className="text-[11px] text-white/50 hidden sm:inline">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight className="h-3 w-3 text-white/20" />
              )}
            </div>
          ))}
        </motion.div>

        <Card className="border border-white/10 bg-[#F5F5F5] text-[#1A1A1A] shadow-2xl shadow-black/30 backdrop-blur-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="font-heading text-2xl font-bold text-[#1A1A1A]">Welcome back</CardTitle>
            <CardDescription className="font-sans text-[#1A1A1A]/65">
              Sign in with your portal code and staff credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Portal code with explainer */}
              <div className="space-y-2">
                <Label htmlFor="restaurant_code" className="font-sans flex items-center gap-1.5">
                  Portal code
                  <span className="group relative">
                    <Info className="h-3.5 w-3.5 text-[#3B82F6]/60 cursor-help" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-52 rounded-lg bg-[#1A1A1A] px-3 py-2 text-[11px] text-white/80 shadow-xl z-50 text-center">
                      Your portal code was generated when your restaurant was created. Ask your admin if you don't have it.
                    </span>
                  </span>
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1A1A]/45" />
                  <Input
                    id="restaurant_code"
                    type="text"
                    placeholder="e.g. hadiq-4f3a"
                    value={credentials.restaurant_code}
                    onChange={(e) => setCredentials({ ...credentials, restaurant_code: e.target.value })}
                    className="h-11 border-[#1A1A1A]/15 bg-white pl-10 pr-10 font-sans font-mono tracking-wide"
                  />
                  <button
                    type="button"
                    onClick={handlePasteCode}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3B82F6]/70 hover:text-[#3B82F6] transition-colors"
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="font-sans">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1A1A]/45" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Your username"
                    value={credentials.username}
                    onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    className="h-11 border-[#1A1A1A]/15 bg-white pl-10 font-sans"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-sans">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1A1A]/45" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="h-11 border-[#1A1A1A]/15 bg-white pl-10 pr-10 font-sans"
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
              </div>

              <Button
                type="submit"
                className="h-11 w-full font-sans text-base font-semibold bg-[#FF6A47] text-white hover:bg-[#ff5a38] shadow-lg shadow-[#FF6A47]/20"
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
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </Button>

              <div className="rounded-lg border border-[#3B82F6]/25 bg-[#3B82F6]/10 p-3 font-sans text-xs text-[#1e40af]">
                <strong>Staff?</strong> Use the portal code from your admin, then the username and password from Settings → Staff portals.
              </div>
            </form>

            <p className="mt-6 text-center font-sans text-sm text-[#1A1A1A]/65">
              New restaurant?{' '}
              <Link to="/signup" className="font-semibold text-[#3B82F6] hover:underline">
                Create a portal
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
    </AuthPageChrome>
  );
}
