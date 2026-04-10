import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, KeyRound, Loader2, Lock, Sparkles, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { authService } from '@/services/api';

export default function Login() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [credentials, setCredentials] = useState({ restaurant_code: '', username: '', password: '' });
  const [signupForm, setSignupForm] = useState({
    restaurant_name: '',
    admin_full_name: '',
    admin_username: '',
    admin_email: '',
    password: '',
  });
  const [isLoadingLogin, setIsLoadingLogin] = useState(false);
  const [isLoadingSignup, setIsLoadingSignup] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingLogin(true);
    
    try {
      await login(credentials);
    } catch (error) {
      // Error handled in auth context
    } finally {
      setIsLoadingLogin(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoadingSignup(true);

    try {
      const response = await authService.signupRestaurant({
        ...signupForm,
        admin_email: signupForm.admin_email.trim() || undefined,
      });

      toast.success(`Restaurant created! Portal code: ${response.restaurant_code}. Create staff in Settings > Staff Portals.`);
      setCredentials((prev) => ({
        ...prev,
        restaurant_code: response.restaurant_code,
        username: response.admin_user.username,
        password: signupForm.password,
      }));
      setActiveTab('login');
      setSignupForm({
        restaurant_name: '',
        admin_full_name: '',
        admin_username: '',
        admin_email: '',
        password: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setIsLoadingSignup(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_8%_10%,#f59e0b24_0,transparent_40%),radial-gradient(circle_at_92%_20%,#14b8a624_0,transparent_40%),linear-gradient(180deg,#fffaf3_0%,#ffffff_50%,#f8fafc_100%)] p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-amber-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/15 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative z-10"
      >
        <Card className="border-2 shadow-2xl backdrop-blur-sm bg-card/95 overflow-hidden">
          <CardHeader className="space-y-6 text-center pb-6 bg-gradient-to-r from-amber-50 to-teal-50 border-b">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="mx-auto"
            >
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 to-teal-600 flex items-center justify-center shadow-lg shadow-amber-500/25">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            
            <div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-teal-600 bg-clip-text text-transparent">
                Servify AI
              </CardTitle>
              <CardDescription className="text-muted-foreground mt-2">
                Multi-restaurant portal with isolated tenant access
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'login' | 'signup')} className="w-full">
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Restaurant Signup</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="restaurant_code">Portal Code</Label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="restaurant_code"
                        type="text"
                        placeholder="e.g. hadiq-4f3a"
                        value={credentials.restaurant_code}
                        onChange={(e) => setCredentials({ ...credentials, restaurant_code: e.target.value })}
                        className="pl-10 h-11"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={credentials.username}
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={credentials.password}
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold bg-gradient-to-r from-amber-500 to-teal-600 hover:from-amber-600 hover:to-teal-700"
                    disabled={isLoadingLogin}
                  >
                    {isLoadingLogin ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>

                  <div className="rounded-md border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                    Staff Login Guide: Use the same Portal Code, then login with staff username/password created in
                    Settings {'>'} Staff Portals.
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="restaurant_name">Restaurant Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="restaurant_name"
                        value={signupForm.restaurant_name}
                        onChange={(e) => setSignupForm({ ...signupForm, restaurant_name: e.target.value })}
                        placeholder="Hadiq Restaurant"
                        className="pl-10 h-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_full_name">Admin Full Name</Label>
                    <Input
                      id="admin_full_name"
                      value={signupForm.admin_full_name}
                      onChange={(e) => setSignupForm({ ...signupForm, admin_full_name: e.target.value })}
                      placeholder="Hadiq"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_username">Admin Username</Label>
                    <Input
                      id="admin_username"
                      value={signupForm.admin_username}
                      onChange={(e) => setSignupForm({ ...signupForm, admin_username: e.target.value })}
                      placeholder="hadiq_admin"
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Admin Email (Optional)</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      value={signupForm.admin_email}
                      onChange={(e) => setSignupForm({ ...signupForm, admin_email: e.target.value })}
                      placeholder="owner@hadiq.com"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup_password">Password</Label>
                    <Input
                      id="signup_password"
                      type="password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                      className="h-11"
                      required
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Button type="submit" className="w-full h-11" disabled={isLoadingSignup}>
                      {isLoadingSignup ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating Portal...
                        </>
                      ) : (
                        'Create Restaurant Portal'
                      )}
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <Button variant="link" onClick={() => navigate('/')}>
                Back to Servify AI Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
