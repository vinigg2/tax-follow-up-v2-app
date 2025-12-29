import {
  Building2,
  CheckSquare,
  FileText,
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
  { heading: 'Operacional' },
  {
    title: 'Tarefas',
    icon: CheckSquare,
    path: '/tasks',
  },
  { heading: 'Clientes' },
  {
    title: 'Empresas',
    icon: Building2,
    path: '/companies',
  },
  { heading: 'Cadastros' },
  {
    title: 'Modelos de Obrigacoes',
    icon: FileText,
    path: '/obligations',
  },
  { heading: 'Equipe' },
  {
    title: 'Times',
    icon: Users,
    path: '/teams',
  },
  {
    title: 'Membros',
    icon: UserCircle,
    path: '/users',
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
