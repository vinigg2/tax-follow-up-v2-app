import { useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Document } from '@/api/documents';
import { useApproveDocument, useRejectDocument } from '@/hooks/useDocuments';

type ApprovalAction = 'approve' | 'reject';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document | null;
  action: ApprovalAction;
  onSuccess?: () => void;
}

export function ApprovalDialog({
  open,
  onOpenChange,
  document,
  action,
  onSuccess,
}: ApprovalDialogProps) {
  const [comment, setComment] = useState('');

  const approveMutation = useApproveDocument();
  const rejectMutation = useRejectDocument();

  const isApprove = action === 'approve';
  const isPending = approveMutation.isPending || rejectMutation.isPending;

  const handleSubmit = async () => {
    if (!document) return;

    // Reject requires a comment
    if (!isApprove && !comment.trim()) {
      toast.error('Comentario obrigatorio para rejeicao');
      return;
    }

    try {
      if (isApprove) {
        await approveMutation.mutateAsync({
          documentId: document.id,
          comment: comment.trim() || undefined,
        });
        toast.success('Documento aprovado!');
      } else {
        await rejectMutation.mutateAsync({
          documentId: document.id,
          comment: comment.trim(),
        });
        toast.success('Documento rejeitado');
      }

      onSuccess?.();
      handleClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(
        err.response?.data?.message ||
          (isApprove ? 'Erro ao aprovar documento' : 'Erro ao rejeitar documento')
      );
    }
  };

  const handleClose = () => {
    setComment('');
    onOpenChange(false);
  };

  if (!document) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isApprove ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                Aprovar Documento
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                Rejeitar Documento
              </>
            )}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {document.name}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="comment">
              Comentario {!isApprove && <span className="text-red-500">*</span>}
            </Label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                isApprove
                  ? 'Comentario opcional...'
                  : 'Descreva o motivo da rejeicao...'
              }
              rows={3}
              maxLength={500}
              className="input w-full resize-none"
              disabled={isPending}
            />
            <p className="text-xs text-gray-500 text-right">
              {comment.length}/500
            </p>
          </div>

          {!isApprove && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Ao rejeitar, o documento sera marcado como "Reiniciado" e o usuario
              podera enviar um novo arquivo.
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          {isApprove ? (
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Aprovando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprovar
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isPending || !comment.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejeitando...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeitar
                </>
              )}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
