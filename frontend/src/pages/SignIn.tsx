import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { KeyRound, Loader2, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthPageChrome } from '@/components/marketing/AuthPageChrome';

export default function SignIn() {
  const [credentials, setCredentials] = useState({ restaurant_code: '', username: '', password: '' });
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
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

  return (
    <AuthPageChrome>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        <Card className="border border-white/10 bg-[#F5F5F5] text-[#1A1A1A] shadow-2xl shadow-black/30">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="font-heading text-2xl font-bold text-[#1A1A1A]">Welcome back</CardTitle>
            <CardDescription className="font-sans text-[#1A1A1A]/65">
              Sign in with your portal code and staff credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="restaurant_code" className="font-sans">
                  Portal code
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1A1A]/45" />
                  <Input
                    id="restaurant_code"
                    type="text"
                    placeholder="e.g. hadiq-4f3a"
                    value={credentials.restaurant_code}
                    onChange={(e) => setCredentials({ ...credentials, restaurant_code: e.target.value })}
                    className="h-11 border-[#1A1A1A]/15 bg-white pl-10 font-sans"
                  />
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
                    type="password"
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    className="h-11 border-[#1A1A1A]/15 bg-white pl-10 font-sans"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-11 w-full font-sans text-base font-semibold bg-[#FF6A47] text-white hover:bg-[#ff5a38]"
                disabled={isLoadingLogin}
              >
                {isLoadingLogin ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

              <div className="rounded-lg border border-[#3B82F6]/25 bg-[#3B82F6]/10 p-3 font-sans text-xs text-[#1e40af]">
                Staff: use the portal code from your admin, then the username and password from Settings → Staff portals.
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
