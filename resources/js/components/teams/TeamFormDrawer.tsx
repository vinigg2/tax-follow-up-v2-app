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
import { Textarea } from '@/components/ui/textarea';
import { useCreateTeam, useUpdateTeam } from '@/hooks/useTeams';
import { Team } from '@/api/teams';
import { Loader2 } from 'lucide-react';

interface TeamFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team | null;
}

export function TeamFormDrawer({ open, onOpenChange, team }: TeamFormDrawerProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();

  const isEditing = !!team;
  const isLoading = createTeam.isPending || updateTeam.isPending;

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [team, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = { name, description };

    try {
      if (isEditing && team) {
        await updateTeam.mutateAsync({ id: team.id, data });
      } else {
        await createTeam.mutateAsync(data);
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving team:', error);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{isEditing ? 'Editar Equipe' : 'Nova Equipe'}</SheetTitle>
          <SheetDescription>
            {isEditing
              ? 'Edite as informacoes da equipe abaixo.'
              : 'Preencha as informacoes para criar uma nova equipe.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit}>
          <SheetBody className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Equipe</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Equipe Fiscal SP"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descricao</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descricao opcional da equipe..."
                rows={4}
              />
            </div>
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
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Salvar' : 'Criar Equipe'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
