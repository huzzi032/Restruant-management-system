import type { User } from '@/types';

export function getRoleHomePath(role?: User['role']): string {
  switch (role) {
    case 'waiter':
      return '/orders';
    case 'chef':
      return '/kitchen';
    case 'cashier':
      return '/billing';
    case 'manager':
    case 'admin':
    default:
      return '/dashboard';
  }
}
