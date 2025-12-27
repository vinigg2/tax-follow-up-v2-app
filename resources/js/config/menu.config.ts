import {
  Building2,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  Users,
  User,
  UserCircle,
} from 'lucide-react';
import { MenuConfig } from './types';

export const MENU_SIDEBAR: MenuConfig = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
  },
  { heading: 'Gerenciamento' },
  {
    title: 'Tarefas',
    icon: CheckSquare,
    path: '/tasks',
  },
  {
    title: 'Obrigacoes',
    icon: ClipboardList,
    path: '/obligations',
  },
  {
    title: 'Empresas',
    icon: Building2,
    path: '/companies',
  },
  { heading: 'Administracao' },
  {
    title: 'Equipes',
    icon: Users,
    path: '/teams',
  },
  {
    title: 'Usuarios',
    icon: UserCircle,
    path: '/users',
  },
  {
    title: 'Perfil',
    icon: User,
    path: '/profile',
  },
];

export const generalSettings = {
  appName: 'Tax Follow-Up',
  appVersion: '1.0.0',
};
