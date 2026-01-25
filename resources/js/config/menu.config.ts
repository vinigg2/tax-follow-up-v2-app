import {
  Building2,
  CheckSquare,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Users,
  User,
  UserCircle,
} from 'lucide-react';
import { MenuConfig } from './types';

/**
 * Menu Configuration
 *
 * Permissions:
 * - minRole: 'admin' = only admins can see
 * - minRole: 'manager' = admins and managers can see
 * - no minRole = everyone can see
 */
export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  { heading: 'Operacional' },
  {
    title: 'Tarefas',
    icon: CheckSquare,
    path: '/tasks',
  },
  {
    title: 'Minhas Aprovacoes',
    icon: ClipboardCheck,
    path: '/approvals',
    minRole: 'manager', // Only managers and admins can approve
  },
  { heading: 'Clientes', minRole: 'admin' }, // Only admins can see this section
  {
    title: 'Empresas',
    icon: Building2,
    path: '/companies',
    minRole: 'admin', // Only admins can manage companies
  },
  { heading: 'Cadastros', minRole: 'manager' }, // Only managers and admins
  {
    title: 'Modelos de Obrigacoes',
    icon: FileText,
    path: '/obligations',
    minRole: 'manager', // Managers and admins can manage obligations
  },
  { heading: 'Equipe', minRole: 'admin' }, // Only admins can see this section
  {
    title: 'Times',
    icon: Users,
    path: '/teams',
    minRole: 'admin', // Only admins can manage teams
  },
  {
    title: 'Membros',
    icon: UserCircle,
    path: '/users',
    minRole: 'admin', // Only admins can manage users
  },
  {
    title: 'Meu Perfil',
    icon: User,
    path: '/profile',
    hidden: true,
  },
];

export const generalSettings = {
  appName: 'Tax Follow-Up',
  appVersion: '1.0.0',
};
