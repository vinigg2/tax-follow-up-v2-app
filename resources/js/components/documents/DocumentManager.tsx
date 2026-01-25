import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Document } from '@/api/documents';
import { useDownloadDocument, useResetDocument } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { DocumentItem } from './DocumentItem';
import { DocumentUploadDialog } from './DocumentUploadDialog';
import { ApprovalDialog } from './ApprovalDialog';

interface DocumentManagerProps {
  taskId: number | string;
  documents: Document[];
  currentUserId?: number;
  readOnly?: boolean;
}

type ApprovalAction = 'approve' | 'reject';

export function DocumentManager({
  documents,
  currentUserId,
  readOnly = false,
}: DocumentManagerProps) {
  const { canManageContent } = useAuth();
  const [uploadDocument, setUploadDocument] = useState<Document | null>(null);
  const [approvalDocument, setApprovalDocument] = useState<Document | null>(null);
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>('approve');
  const [resetDocument, setResetDocument] = useState<Document | null>(null);

  const { download, isDownloading } = useDownloadDocument();
  const resetMutation = useResetDocument();

  // Calculate progress for obligatory documents
  const progress = useMemo(() => {
    const obligatory = documents.filter((d) => d.is_obligatory);
    const finished = obligatory.filter((d) => d.status === 'finished');
    return {
      total: obligatory.length,
      finished: finished.length,
      percent: obligatory.length > 0 ? (finished.length / obligatory.length) * 100 : 100,
    };
  }, [documents]);

  // Sort documents: obligatory first, then by order_items
  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => {
      if (a.is_obligatory !== b.is_obligatory) {
        return a.is_obligatory ? -1 : 1;
      }
      return (a.order_items || 0) - (b.order_items || 0);
    });
  }, [documents]);

  const handleUpload = (doc: Document) => {
    setUploadDocument(doc);
  };

  const handleDownload = async (doc: Document) => {
    try {
      await download(doc.id, doc.name);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erro ao baixar arquivo');
    }
  };

  const handleApprove = (doc: Document) => {
    setApprovalDocument(doc);
    setApprovalAction('approve');
  };

  const handleReject = (doc: Document) => {
    setApprovalDocument(doc);
    setApprovalAction('reject');
  };

  const handleReset = (doc: Document) => {
    setResetDocument(doc);
  };

  const confirmReset = async () => {
    if (!resetDocument) return;

    try {
      await resetMutation.mutateAsync(resetDocument.id);
      toast.success('Documento reiniciado');
      setResetDocument(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erro ao reiniciar documento');
    }
  };

  if (documents.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="Nenhum documento"
        description="Esta tarefa nao possui documentos vinculados."
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      {progress.total > 0 && (
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {progress.percent >= 100 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Documentos Obrigatorios
              </span>
            </div>
            <span className="text-sm text-gray-500">
              {progress.finished} de {progress.total} concluidos
            </span>
          </div>
          <Progress value={progress.percent} className="h-2" />
        </div>
      )}

      {/* Document list */}
      <div className="space-y-3">
        {sortedDocuments.map((doc) => (
          <DocumentItem
            key={doc.id}
            document={doc}
            currentUserId={currentUserId}
            isGroupAdmin={canManageContent(doc.group_id)}
            onUpload={readOnly ? () => {} : handleUpload}
            onDownload={handleDownload}
            onApprove={readOnly ? undefined : handleApprove}
            onReject={readOnly ? undefined : handleReject}
            onReset={readOnly ? undefined : handleReset}
            isDownloading={isDownloading}
          />
        ))}
      </div>

      {/* Upload dialog */}
      <DocumentUploadDialog
        open={!!uploadDocument}
        onOpenChange={(open) => !open && setUploadDocument(null)}
        document={uploadDocument}
      />

      {/* Approval dialog */}
      <ApprovalDialog
        open={!!approvalDocument}
        onOpenChange={(open) => !open && setApprovalDocument(null)}
        document={approvalDocument}
        action={approvalAction}
      />

      {/* Reset confirmation dialog */}
      <AlertDialog
        open={!!resetDocument}
        onOpenChange={(open) => !open && setResetDocument(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reiniciar documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja reiniciar o documento "{resetDocument?.name}"?
              O arquivo sera removido e todas as aprovacoes serao canceladas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReset}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={resetMutation.isPending}
            >
              {resetMutation.isPending ? 'Reiniciando...' : 'Reiniciar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
