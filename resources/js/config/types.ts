import { type LucideIcon } from 'lucide-react';

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
  hidden?: boolean = false;
  separator?: boolean;
}

export type MenuConfig = MenuItem[];
