import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useCreateUser, useUpdateUser } from '@/hooks/useUsers';
import { useTeams } from '@/hooks/useTeams';
import { User } from '@/api/users';
import { Loader2, Eye, EyeOff } from 'lucide-react';

interface UserFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
}

export function UserFormDrawer({ open, onOpenChange, user }: UserFormDrawerProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [teamId, setTeamId] = useState<number | undefined>();
  const [isActive, setIsActive] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const { data: teamsData } = useTeams();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const teams = teamsData?.teams || [];
  const isEditing = !!user;
  const isLoading = createUser.isPending || updateUser.isPending;

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setCpf(user.cpf ? formatCPF(user.cpf) : '');
      setPhone(user.phone ? formatPhone(user.phone) : '');
      setTeamId(user.team_id);
      setIsActive(user.is_active !== false);
      setPassword('');
      setPasswordConfirmation('');
    } else {
      setName('');
      setEmail('');
      setCpf('');
      setPhone('');
      setPassword('');
      setPasswordConfirmation('');
      setTeamId(undefined);
      setIsActive(true);
    }
  }, [user, open]);

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      email,
      cpf: cpf.replace(/\D/g, '') || undefined,
      phone: phone.replace(/\D/g, '') || undefined,
      team_id: teamId,
      is_active: isActive,
      ...(password && {
        password,
        password_confirmation: passwordConfirmation,
      }),
    };

    try {
      if (isEditing && user) {
        await updateUser.mutateAsync({ id: user.id, data });
      } else {
        await createUser.mutateAsync(data as any);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const isPasswordValid = !password || (password.length >= 8 && password === passwordConfirmation);
  const canSubmit = name.trim() && email.trim() && (isEditing || (password && isPasswordValid));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Usuario' : 'Novo Usuario'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Edite as informacoes do usuario abaixo.'
              : 'Preencha as informacoes para cadastrar um novo usuario.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit}>
          <SheetBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Joao da Silva"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@empresa.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={handleCPFChange}
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="team">Equipe</Label>
              <select
                id="team"
                value={teamId || ''}
                onChange={(e) => setTeamId(e.target.value ? Number(e.target.value) : undefined)}
                className="input w-full"
              >
                <option value="">Sem equipe</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                {isEditing ? 'Alterar Senha (opcional)' : 'Senha de Acesso *'}
              </h4>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {isEditing ? 'Nova Senha' : 'Senha *'}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimo 8 caracteres"
                      required={!isEditing}
                      minLength={8}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password_confirmation">
                    Confirmar Senha {!isEditing && '*'}
                  </Label>
                  <Input
                    id="password_confirmation"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Repita a senha"
                    required={!isEditing && !!password}
                  />
                  {password && passwordConfirmation && password !== passwordConfirmation && (
                    <p className="text-sm text-red-500">As senhas nao coincidem</p>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center justify-between pt-2">
                <div>
                  <Label htmlFor="is_active" className="text-sm font-medium">
                    Usuario Ativo
                  </Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Usuarios inativos nao podem acessar o sistema
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isActive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            )}
          </SheetBody>

          <SheetFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !canSubmit}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Cadastrar'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
