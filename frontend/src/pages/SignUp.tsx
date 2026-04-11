import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { authService } from '@/services/api';
import { AuthPageChrome } from '@/components/marketing/AuthPageChrome';

export default function SignUp() {
  const [signupForm, setSignupForm] = useState({
    restaurant_name: '',
    admin_full_name: '',
    admin_username: '',
    admin_email: '',
    password: '',
  });
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSignup(true);
    try {
      const response = await authService.signupRestaurant({
        ...signupForm,
        admin_email: signupForm.admin_email.trim() || undefined,
      });
      toast.success(
        `Restaurant created! Portal code: ${response.restaurant_code}. Add staff under Settings → Staff portals.`,
      );
      setSignupForm({
        restaurant_name: '',
        admin_full_name: '',
        admin_username: '',
        admin_email: '',
        password: '',
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { detail?: string } } };
      toast.error(err.response?.data?.detail || 'Signup failed');
    } finally {
      setIsLoadingSignup(false);
    }
  };

  return (
    <AuthPageChrome>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-2xl"
      >
        <Card className="border border-white/10 bg-[#F5F5F5] text-[#1A1A1A] shadow-2xl shadow-black/30">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="font-heading text-2xl font-bold text-[#1A1A1A]">Create your restaurant portal</CardTitle>
            <CardDescription className="font-sans text-[#1A1A1A]/65">
              You’ll get a portal code and admin login — then invite your team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="restaurant_name" className="font-sans">
                  Restaurant name
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1A1A]/45" />
                  <Input
                    id="restaurant_name"
                    value={signupForm.restaurant_name}
                    onChange={(e) => setSignupForm({ ...signupForm, restaurant_name: e.target.value })}
                    placeholder="Your restaurant"
                    className="h-11 border-[#1A1A1A]/15 bg-white pl-10 font-sans"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_full_name" className="font-sans">
                  Admin full name
                </Label>
                <Input
                  id="admin_full_name"
                  value={signupForm.admin_full_name}
                  onChange={(e) => setSignupForm({ ...signupForm, admin_full_name: e.target.value })}
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_email" className="font-sans">
                  Admin email (optional)
                </Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={signupForm.admin_email}
                  onChange={(e) => setSignupForm({ ...signupForm, admin_email: e.target.value })}
                  className="h-11 border-[#1A1A1A]/15 bg-white font-sans"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup_password" className="font-sans">
                  Password
                </Label>
                <Input
                  id="signup_password"
                  type="password"
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  className="h-11 border-[#1A1A1A]/15 bg-white font-sans"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  className="mt-2 h-11 w-full font-sans text-base font-semibold bg-[#FF6A47] text-white hover:bg-[#ff5a38]"
                  disabled={isLoadingSignup}
                >
                  {isLoadingSignup ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating portal…
                    </>
                  ) : (
                    'Create portal'
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
    </AuthPageChrome>
  );
}
