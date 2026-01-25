import { type LucideIcon } from 'lucide-react';
import { GroupRole } from '@/context/AuthContext';

export interface MenuItem {
  title?: string;
  icon?: LucideIcon;
  path?: string;
  rootPath?: string;
  childrenIndex?: number;
  heading?: string;
  children?: MenuConfig;
  disabled?: boolean;
  collapse?: boolean;
  collapseTitle?: string;
  expandTitle?: string;
  badge?: string;
  hidden?: boolean;
  separator?: boolean;
  /**
   * Minimum role required to see this menu item.
   * If not set, the item is visible to all roles.
   * 'admin' = only admins
   * 'manager' = admins and managers
   * 'member' = everyone (default)
   */
  minRole?: GroupRole;
}

export type MenuConfig = MenuItem[];
