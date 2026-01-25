import {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { authApi } from '../api/auth';

export interface User {
  id: number;
  name: string;
  email: string;
  [key: string]: unknown;
}

export interface Group {
  id: number;
  name: string;
  [key: string]: unknown;
}

export type GroupRole = 'admin' | 'manager' | 'member';

export interface Permissions {
  admin_groups?: number[];
  manager_groups?: number[];
  member_groups?: number[];
  owner_groups?: number[];
  [key: string]: unknown;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface AuthContextType {
  user: User | null;
  groups: Group[];
  permissions: Permissions;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ user: User; token: string; groups?: Group[] }>;
  register: (userData: RegisterData) => Promise<{ user: User; token: string }>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
  fetchUser: () => Promise<void>;
  // Role checks
  isAdmin: (groupId: number) => boolean;
  isManager: (groupId: number) => boolean;
  isMember: (groupId: number) => boolean;
  isOwner: (groupId: number) => boolean;
  // Helper functions
  getRole: (groupId: number) => GroupRole | null;
  canManageContent: (groupId: number) => boolean; // admin or manager
  canManageUsers: (groupId: number) => boolean; // admin only
}

export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const data = await authApi.getUser();
      setUser(data.user);
      setGroups(data.groups || []);
      setPermissions(data.permissions || {});
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      setGroups([]);
      setPermissions({});
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (credentials: LoginCredentials) => {
    const data = await authApi.login(credentials);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    setGroups(data.groups || []);
    setPermissions(data.permissions || {});
    return data;
  };

  const register = async (userData: RegisterData) => {
    const data = await authApi.register(userData);
    localStorage.setItem('token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setGroups([]);
      setPermissions({});
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Role check functions
  const isOwner = (groupId: number) => {
    return permissions.owner_groups?.includes(groupId) || false;
  };

  const isAdmin = (groupId: number) => {
    // Owner has admin privileges
    return permissions.admin_groups?.includes(groupId) || isOwner(groupId);
  };

  const isManager = (groupId: number) => {
    return permissions.manager_groups?.includes(groupId) || false;
  };

  const isMember = (groupId: number) => {
    return permissions.member_groups?.includes(groupId) || false;
  };

  /**
   * Get the user's role in a specific group
   * Returns 'admin', 'manager', 'member', or null if not a member
   */
  const getRole = (groupId: number): GroupRole | null => {
    if (isAdmin(groupId)) return 'admin';
    if (isManager(groupId)) return 'manager';
    if (isMember(groupId)) return 'member';
    return null;
  };

  /**
   * Check if user can manage content (tasks, obligations, documents approval, etc)
   * Admin and Manager can manage content
   */
  const canManageContent = (groupId: number): boolean => {
    return isAdmin(groupId) || isManager(groupId);
  };

  /**
   * Check if user can manage users and companies
   * Only Admin can manage users and companies
   */
  const canManageUsers = (groupId: number): boolean => {
    return isAdmin(groupId);
  };

  const value: AuthContextType = {
    user,
    groups,
    permissions,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    fetchUser,
    isAdmin,
    isManager,
    isMember,
    isOwner,
    getRole,
    canManageContent,
    canManageUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
