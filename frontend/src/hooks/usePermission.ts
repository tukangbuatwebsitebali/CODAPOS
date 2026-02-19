import { useAuthStore } from '@/store';
import type { UserRole } from '@/types';

// Permission action constants matching backend middleware/permission.go
const PERMISSION_MAP: Record<string, UserRole[]> = {
    manage_users: ['super_admin', 'owner'],
    manage_products: ['super_admin', 'owner', 'admin', 'outlet_manager'],
    read_products: ['super_admin', 'owner', 'admin', 'outlet_manager', 'cashier'],
    manage_outlets: ['super_admin', 'owner', 'admin'],
    pos_checkout: ['super_admin', 'owner', 'admin', 'outlet_manager', 'cashier'],
    pos_refund: ['super_admin', 'owner', 'admin', 'outlet_manager'],
    read_transactions: ['super_admin', 'owner', 'admin', 'finance', 'outlet_manager', 'cashier'],
    manage_accounting: ['super_admin', 'owner', 'finance'],
    manage_customers: ['super_admin', 'owner', 'admin', 'outlet_manager', 'cashier'],
    manage_settings: ['super_admin', 'owner'],
    super_admin: ['super_admin'],
};

export function usePermission() {
    const user = useAuthStore((state) => state.user);
    const role = (user?.role || 'cashier') as UserRole;

    const hasPermission = (action: string): boolean => {
        if (role === 'super_admin') return true;
        const allowed = PERMISSION_MAP[action];
        if (!allowed) return false;
        return allowed.includes(role);
    };

    const hasRole = (...roles: UserRole[]): boolean => {
        return roles.includes(role);
    };

    const isOwnerOrAbove = (): boolean => {
        return role === 'super_admin' || role === 'owner';
    };

    return { role, hasPermission, hasRole, isOwnerOrAbove };
}
