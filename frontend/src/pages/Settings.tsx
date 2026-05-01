import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  User,
  Bell,
  Shield,
  Store,
  CreditCard,
  Users,
  QrCode,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { publicMenuService, resolveMediaUrl, systemService, userService } from '@/services/api';
import { toast } from 'sonner';
import type { BulkUserCreateResponse } from '@/types';

export default function SettingsPage() {
  const { user, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = hasRole(['admin']);

  const [bulkForm, setBulkForm] = useState({
    role: 'waiter',
    quantity: '2',
    username_prefix: 'waiter',
    name_prefix: 'Waiter',
    shared_password: 'staff123',
    start_index: '1',
    names: '',
  });

  const [businessForm, setBusinessForm] = useState({
    tax_rate: '0.10',
    currency: 'PKR',
  });
  const [lastBulkResult, setLastBulkResult] = useState<BulkUserCreateResponse | null>(null);
  const [lastSharedPassword, setLastSharedPassword] = useState('');

  const [resName, setResName] = useState(localStorage.getItem('restaurant_name') || 'Restaurant Pro');
  const [resLogo, setResLogo] = useState(localStorage.getItem('restaurant_logo') || '');

  const handleSaveBranding = () => {
    localStorage.setItem('restaurant_name', resName);
    localStorage.setItem('restaurant_logo', resLogo);
    toast.success('Branding updated successfully!');
  };

  const handleSave = () => {
    toast.success('Settings saved successfully!');
  };

  const { data: users } = useQuery({
    queryKey: ['users', 'settings-list'],
    queryFn: () => userService.getUsers({ limit: 200 }),
    enabled: isAdmin,
  });

  const { data: qrData } = useQuery({
    queryKey: ['public-menu-qr'],
    queryFn: () => publicMenuService.getQRCode(260),
  });

  const { data: businessSettings } = useQuery({
    queryKey: ['business-settings'],
    queryFn: systemService.getBusinessSettings,
  });

  useEffect(() => {
    if (!businessSettings) return;
    setBusinessForm({
      tax_rate: String(businessSettings.tax_rate),
      currency: businessSettings.currency,
    });
  }, [businessSettings]);

  const bulkCreateMutation = useMutation({
    mutationFn: userService.createUsersBulk,
    onSuccess: (result) => {
      setLastBulkResult(result);
      queryClient.invalidateQueries({ queryKey: ['users'] });
      if (result.created_users.length > 0) {
        toast.success(`${result.created_users.length} portal accounts created. Use shown usernames to login.`);
      }
      if (result.skipped_usernames.length > 0) {
        toast.warning(`Skipped existing usernames: ${result.skipped_usernames.join(', ')}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create role portals');
    },
  });

  const updateBusinessMutation = useMutation({
    mutationFn: systemService.updateBusinessSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
      toast.success('Business settings updated');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to update business settings');
    },
  });

  const roleCounts = useMemo(() => {
    if (!users) return {} as Record<string, number>;
    return users.reduce((acc, item) => {
      acc[item.role] = (acc[item.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [users]);

  const handleBulkCreate = () => {
    if (!bulkForm.shared_password || bulkForm.shared_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLastSharedPassword(bulkForm.shared_password);

    bulkCreateMutation.mutate({
      role: bulkForm.role as 'admin' | 'manager' | 'waiter' | 'chef' | 'cashier',
      quantity: Number(bulkForm.quantity || '0'),
      username_prefix: bulkForm.username_prefix.trim(),
      name_prefix: bulkForm.name_prefix.trim(),
      shared_password: bulkForm.shared_password,
      start_index: Number(bulkForm.start_index || '1'),
      names: bulkForm.names
        .split('\n')
        .map((name) => name.trim())
        .filter(Boolean),
    });
  };

  const handleSaveBusiness = () => {
    updateBusinessMutation.mutate({
      tax_rate: Number(businessForm.tax_rate || '0'),
      currency: businessForm.currency.trim().toUpperCase(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your restaurant settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="w-full overflow-x-auto justify-start">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="staff-portals" className="gap-2">
              <Users className="h-4 w-4" />
              Staff Portals
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Restaurant Information
              </CardTitle>
              <CardDescription>
                Update your restaurant details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Restaurant Name (Display & Bills)</Label>
                  <Input 
                    placeholder="Your Restaurant Name" 
                    value={resName}
                    onChange={(e) => setResName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Restaurant Logo URL</Label>
                  <Input 
                    placeholder="https://example.com/logo.png" 
                    value={resLogo}
                    onChange={(e) => setResLogo(e.target.value)}
                  />
                  {resLogo && (
                    <div className="mt-2 p-2 border rounded-md w-fit bg-muted/50">
                      <img src={resLogo} alt="Logo Preview" className="h-12 object-contain" />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input placeholder="+1 234 567 8900" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input placeholder="contact@restaurant.com" />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input placeholder="123 Main St, City" />
                </div>
              </div>
              <Button onClick={handleSaveBranding}>Save Branding</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Business Settings
              </CardTitle>
              <CardDescription>
                Configure tax rates and currency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={String((Number(businessForm.tax_rate || '0') * 100).toFixed(2))}
                    onChange={(e) => {
                      const percentage = Number(e.target.value || '0');
                      setBusinessForm((prev) => ({ ...prev, tax_rate: String(percentage / 100) }));
                    }}
                  />
                </div>
              </div>
              <Button onClick={handleSaveBusiness} className="w-full sm:w-auto" disabled={updateBusinessMutation.isPending}>
                {updateBusinessMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Public Menu QR
              </CardTitle>
              <CardDescription>
                Place this QR on tables to open your digital menu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {qrData ? (
                <>
                  <img
                    src={`data:${qrData.content_type};base64,${qrData.qr_code_base64}`}
                    alt="Public menu QR code"
                    className="w-44 h-44 border rounded-md"
                  />
                  <img
                    src={resolveMediaUrl(`/api/v1/menu/public/qr-code/image?size=260`)}
                    alt="Public menu QR code direct"
                    className="w-44 h-44 border rounded-md"
                  />
                  <p className="text-sm text-muted-foreground break-all">{qrData.menu_url}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading QR code...</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-10 w-10" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{user?.full_name}</p>
                  <p className="text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input defaultValue={user?.full_name} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input defaultValue={user?.email} />
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input defaultValue={user?.username} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input defaultValue={user?.role} disabled />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full sm:w-auto">Update Profile</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">New Orders</p>
                  <p className="text-sm text-muted-foreground">Get notified when a new order is placed</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when inventory is running low</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">Daily Reports</p>
                  <p className="text-sm text-muted-foreground">Receive daily sales summary</p>
                </div>
                <Switch />
              </div>
              <Button onClick={handleSave} className="w-full sm:w-auto">Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" placeholder="Enter current password" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" placeholder="Enter new password" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" placeholder="Confirm new password" />
              </div>
              <Button onClick={handleSave} className="w-full sm:w-auto">Change Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="staff-portals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Role Portals</CardTitle>
                <CardDescription>
                  Create multiple waiter/chef/cashier/manager accounts with one shared password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <select
                      className="h-10 rounded-md border bg-background px-3 w-full"
                      value={bulkForm.role}
                      onChange={(e) => setBulkForm((prev) => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="waiter">Waiter</option>
                      <option value="chef">Chef</option>
                      <option value="cashier">Cashier</option>
                      <option value="manager">Manager</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>How many portals?</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={bulkForm.quantity}
                      onChange={(e) => setBulkForm((prev) => ({ ...prev, quantity: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Username Prefix</Label>
                    <Input
                      value={bulkForm.username_prefix}
                      onChange={(e) => setBulkForm((prev) => ({ ...prev, username_prefix: e.target.value }))}
                      placeholder="waiter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Name Prefix</Label>
                    <Input
                      value={bulkForm.name_prefix}
                      onChange={(e) => setBulkForm((prev) => ({ ...prev, name_prefix: e.target.value }))}
                      placeholder="Waiter"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Specific Names (one per line)</Label>
                    <textarea
                      className="w-full min-h-24 rounded-md border bg-background p-2 text-sm"
                      value={bulkForm.names}
                      onChange={(e) => setBulkForm((prev) => ({ ...prev, names: e.target.value }))}
                      placeholder={'ali\nahmed\nhuzaifa'}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shared Password</Label>
                    <Input
                      type="text"
                      value={bulkForm.shared_password}
                      onChange={(e) => setBulkForm((prev) => ({ ...prev, shared_password: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Start Index</Label>
                    <Input
                      type="number"
                      min="1"
                      value={bulkForm.start_index}
                      onChange={(e) => setBulkForm((prev) => ({ ...prev, start_index: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handleBulkCreate} disabled={bulkCreateMutation.isPending}>
                  {bulkCreateMutation.isPending ? 'Creating...' : 'Create Role Portals'}
                </Button>

                {lastBulkResult && lastBulkResult.created_users.length > 0 && (
                  <div className="rounded-md border p-3 space-y-3">
                    <p className="text-sm font-medium">New Portal Credentials</p>
                    <p className="text-xs text-muted-foreground">
                      Use these exact credentials for staff login with your restaurant portal code.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {lastBulkResult.created_users.map((staff) => (
                        <div key={staff.id} className="rounded-md bg-muted/50 p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0 space-y-1">
                            <p className="font-medium truncate">{staff.full_name}</p>
                            <p className="text-muted-foreground truncate">@{staff.username}</p>
                            <p className="text-xs text-muted-foreground">ID: {staff.id}</p>
                            <p className="text-xs text-muted-foreground">Password: {lastSharedPassword || bulkForm.shared_password}</p>
                          </div>
                          <Badge variant="outline" className="capitalize shrink-0">{staff.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portal Summary</CardTitle>
                <CardDescription>Current account count by role</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {['admin', 'manager', 'waiter', 'chef', 'cashier'].map((role) => (
                  <Badge key={role} variant="secondary" className="capitalize">
                    {role}: {roleCounts[role] || 0}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
}