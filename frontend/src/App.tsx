import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { getRoleHomePath } from './lib/role-home';

// Pages
const Home = lazy(() => import('./pages/Home'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const MenuManagement = lazy(() => import('./pages/MenuManagement'));
const OrderTaking = lazy(() => import('./pages/OrderTaking'));
const KitchenDisplay = lazy(() => import('./pages/KitchenDisplay'));
const Billing = lazy(() => import('./pages/Billing'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Employees = lazy(() => import('./pages/Employees'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const PublicMenu = lazy(() => import('./pages/PublicMenu'));

// Create Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={getRoleHomePath(user?.role)} replace />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router>
          <AuthProvider>
            <Suspense fallback={<div className="min-h-screen grid place-items-center text-muted-foreground">Loading...</div>}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/login" element={<Login />} />
                <Route path="/menu/public" element={<PublicMenu />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/portal" element={<RoleHomeRedirect />} />

                    <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'waiter', 'chef', 'cashier']} />}>
                      <Route path="/dashboard" element={<Dashboard />} />
                    </Route>
                    <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'chef']} />}>
                      <Route path="/menu" element={<MenuManagement />} />
                    </Route>
                    <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'waiter']} />}>
                      <Route path="/orders" element={<OrderTaking />} />
                    </Route>
                    <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'chef']} />}>
                      <Route path="/kitchen" element={<KitchenDisplay />} />
                    </Route>
                    <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']} />}>
                      <Route path="/billing" element={<Billing />} />
                    </Route>
                    <Route element={<ProtectedRoute allowedRoles={['admin', 'manager', 'chef']} />}>
                      <Route path="/inventory" element={<Inventory />} />
                    </Route>
                    <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                      <Route path="/employees" element={<Employees />} />
                    </Route>
                    <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                      <Route path="/reports" element={<Reports />} />
                    </Route>
                    <Route element={<ProtectedRoute allowedRoles={['admin', 'manager']} />}>
                      <Route path="/settings" element={<Settings />} />
                    </Route>
                  </Route>
                </Route>
                
                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
