import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Utensils,
  ClipboardList,
  ChefHat,
  CreditCard,
  Package,
  Users,
  BarChart3,
  Settings,
  Menu,
  User,
  LogOut,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'waiter', 'chef', 'cashier'] },
  { name: 'Menu', href: '/menu', icon: Utensils, roles: ['admin', 'manager', 'chef'] },
  { name: 'Orders', href: '/orders', icon: ClipboardList, roles: ['admin', 'manager', 'waiter'] },
  { name: 'Kitchen', href: '/kitchen', icon: ChefHat, roles: ['admin', 'manager', 'chef'] },
  { name: 'Billing', href: '/billing', icon: CreditCard, roles: ['admin', 'manager', 'cashier'] },
  { name: 'Inventory', href: '/inventory', icon: Package, roles: ['admin', 'manager', 'chef'] },
  { name: 'Employees', href: '/employees', icon: Users, roles: ['admin', 'manager'] },
  { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
  { name: 'Settings', href: '/settings', icon: Settings, roles: ['admin', 'manager'] },
];

function Sidebar({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const { user, logout, hasRole } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const location = useLocation();

  const filteredNav = navigation.filter(item => hasRole(item.roles));

  return (
    <div className={cn('flex flex-col h-full bg-card border-r', className)}>
      {/* Logo */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Utensils className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight line-clamp-1">{user?.restaurant_name || 'Servify AI'}</h1>
            <p className="text-xs text-muted-foreground line-clamp-1">{user?.restaurant_code || 'restaurant portal'}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 min-h-11',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'animate-pulse')} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Bottom Section */}
      <div className="p-4 border-t space-y-4">
        {/* Theme Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
              {resolvedTheme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="capitalize">{theme} Theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme('light')}>
              <Sun className="h-4 w-4 mr-2" /> Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('dark')}>
              <Moon className="h-4 w-4 mr-2" /> Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme('system')}>
              <Monitor className="h-4 w-4 mr-2" /> System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4" />
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-medium">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { hasRole } = useAuth();

  const filteredNav = navigation.filter((item) => hasRole(item.roles));
  const currentNav = filteredNav.find((item) => item.href === location.pathname);
  const quickActions = filteredNav.filter((item) => ['Dashboard', 'Orders', 'Billing', 'Kitchen'].includes(item.name)).slice(0, 4);

  return (
    <div className="flex h-dvh bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onNavigate={() => setOpen(false)} />
        </SheetContent>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="lg:hidden sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
            <div className="h-14 px-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <p className="font-semibold text-sm">{currentNav?.name || 'Restaurant'}</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-10 px-3">
                <NavLink to="/dashboard">Home</NavLink>
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-3 sm:p-4 lg:p-8 pb-24 lg:pb-8">
            <div className="max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>

          {quickActions.length > 0 && (
            <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
              <div className="rounded-2xl border bg-card/95 backdrop-blur p-2 shadow-lg">
                <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${quickActions.length}, minmax(0, 1fr))` }}>
                  {quickActions.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Button
                        key={item.name}
                        asChild
                        variant={isActive ? 'default' : 'ghost'}
                        className="h-12 px-2 flex-col gap-1"
                      >
                        <NavLink to={item.href}>
                          <Icon className="h-4 w-4" />
                          <span className="text-[11px] leading-none">{item.name}</span>
                        </NavLink>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </main>
      </Sheet>
    </div>
  );
}
