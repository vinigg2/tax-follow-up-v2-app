import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { authApi } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  Shield,
  Key,
  Loader2,
  Camera,
  Building2,
  Calendar,
  CheckCircle,
  Edit3,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
}

interface PasswordFormData {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'security'>('overview');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: (user as any)?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    defaultValues: {
      current_password: '',
      password: '',
      password_confirmation: '',
    },
  });

  const handleProfileSubmit = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      const response = await authApi.updateProfile(data as unknown as Record<string, unknown>);
      updateUser(response.user);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    if (data.password !== data.password_confirmation) {
      toast.error('As senhas nao coincidem');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await authApi.updatePassword(data);
      passwordForm.reset();
      toast.success('Senha alterada com sucesso!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const tabs = [
    { id: 'overview', label: 'Visao Geral', icon: User },
    { id: 'settings', label: 'Configuracoes', icon: Edit3 },
    { id: 'security', label: 'Seguranca', icon: Shield },
  ] as const;

  return (
    <div className="container-fluid space-y-6">
      {/* Profile Header - Centered Style */}
      <div className="card overflow-hidden relative">
        {/* Banner with mask background - extends behind content */}
        <div className="absolute inset-x-0 top-0 h-48 sm:h-56">
          {/* Light mode background */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat dark:hidden"
            style={{ backgroundImage: "url('/images/mask-bg.png')" }}
          />
          {/* Dark mode background */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat hidden dark:block"
            style={{ backgroundImage: "url('/images/mask-darkness-bg.png')" }}
          />
        </div>

        {/* Centered Profile Info */}
        <div className="flex flex-col items-center pt-8 sm:pt-8 relative z-10">
          {/* Avatar */}
          <div className="relative">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border-4 border-white dark:border-gray-900 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl">
              {(user as any)?.avatar ? (
                <img
                  src={(user as any).avatar}
                  alt={user?.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-4xl sm:text-5xl font-bold text-white">
                  {getInitials(user?.name || 'U')}
                </span>
              )}
            </div>
            <button className="absolute bottom-2 right-2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border border-gray-200 dark:border-gray-700">
              <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* User Info - Centered */}
          <div className="text-center mt-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {user?.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 mt-2">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-full">
                <CheckCircle className="w-4 h-4" />
                Ativo
              </span>
              {(user as any)?.team?.name && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
                  <Building2 className="w-4 h-4" />
                  {(user as any).team.name}
                </span>
              )}
            </div>
          </div>

          {/* Tabs - Centered */}
          <div className="flex items-center justify-center gap-1 mt-8 border-b border-gray-200 dark:border-gray-700 w-full px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* About */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Sobre
                </h3>
              </div>
              <div className="p-6">
                <dl className="grid gap-6 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Nome Completo</dt>
                      <dd className="mt-1 font-medium text-gray-900 dark:text-white">{user?.name}</dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">E-mail</dt>
                      <dd className="mt-1 font-medium text-gray-900 dark:text-white">{user?.email}</dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Telefone</dt>
                      <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                        {(user as any)?.phone || '-'}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <dt className="text-sm text-gray-500 dark:text-gray-400">Equipe</dt>
                      <dd className="mt-1 font-medium text-gray-900 dark:text-white">
                        {(user as any)?.team?.name || '-'}
                      </dd>
                    </div>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Info */}
            <div className="card">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Informacoes da Conta
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Membro desde</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatDate((user as any)?.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800">
                    <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <p className="font-medium text-green-600 dark:text-green-400">Conta Ativa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="mx-auto">
          <div className="card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Editar Perfil
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Atualize suas informacoes pessoais
              </p>
            </div>
            <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  {...profileForm.register('name', { required: true })}
                  placeholder="Seu nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  {...profileForm.register('email', { required: true })}
                  placeholder="seu@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  {...profileForm.register('phone')}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdatingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Salvar Alteracoes
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => profileForm.reset()}
                  disabled={isUpdatingProfile}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="mx-auto">
          <div className="card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Key className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Alterar Senha
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Atualize sua senha para manter sua conta segura
                  </p>
                </div>
              </div>
            </div>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="p-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current_password">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="current_password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...passwordForm.register('current_password', { required: true })}
                    placeholder="Digite sua senha atual"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showNewPassword ? 'text' : 'password'}
                    {...passwordForm.register('password', { required: true, minLength: 8 })}
                    placeholder="Digite sua nova senha"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Minimo de 8 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password_confirmation">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...passwordForm.register('password_confirmation', { required: true })}
                    placeholder="Confirme sua nova senha"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {isUpdatingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Alterar Senha
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => passwordForm.reset()}
                  disabled={isUpdatingPassword}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>

          {/* Security Tips */}
          <div className="card mt-6">
            <div className="p-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-4">
                Dicas de Seguranca
              </h4>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Use uma senha forte com letras, numeros e simbolos
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Nao compartilhe sua senha com outras pessoas
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Altere sua senha periodicamente
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  Use senhas diferentes para cada servico
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
