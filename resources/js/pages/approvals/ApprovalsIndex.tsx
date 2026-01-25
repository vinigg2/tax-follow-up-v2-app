import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ClipboardCheck,
  FileText,
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  Download,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ApprovalDialog } from '@/components/documents/ApprovalDialog';
import { ApprovalWorkflowStatus } from '@/components/documents/ApprovalWorkflowStatus';
import { tasksApi, Task } from '@/api/tasks';
import { Document, formatFileSize } from '@/api/documents';
import { useDownloadDocument } from '@/hooks/useDocuments';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type ApprovalAction = 'approve' | 'reject';

export default function ApprovalsIndex() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [approvalDocument, setApprovalDocument] = useState<Document | null>(null);
  const [approvalAction, setApprovalAction] = useState<ApprovalAction>('approve');

  const { download, isDownloading } = useDownloadDocument();

  // Fetch tasks with pending approvals for current user
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['tasks', 'myApprovals'],
    queryFn: () => tasksApi.getByMethod('myApprovals'),
  });

  const tasks = (data?.tasks || []) as Task[];

  // Flatten documents that need approval from all tasks
  const pendingApprovals = tasks.flatMap((task) => {
    const docs = (task.documents || []).filter((doc) =>
      doc.approverSignatures?.some(
        (sig) => sig.user_id === user?.id && sig.status === 'pending'
      )
    );
    return docs.map((doc) => ({ task, document: doc }));
  });

  const handleApprove = (doc: Document) => {
    setApprovalDocument(doc);
    setApprovalAction('approve');
  };

  const handleReject = (doc: Document) => {
    setApprovalDocument(doc);
    setApprovalAction('reject');
  };

  const handleDownload = async (doc: Document) => {
    try {
      await download(doc.id, doc.name);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Erro ao baixar arquivo');
    }
  };

  const handleApprovalSuccess = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="container-fluid space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ClipboardCheck className="w-7 h-7" />
            Minhas Aprovacoes
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Documentos aguardando sua aprovacao
          </p>
        </div>
        {pendingApprovals.length > 0 && (
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {pendingApprovals.length} pendente{pendingApprovals.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Pending approvals list */}
      {pendingApprovals.length === 0 ? (
        <EmptyState
          illustration="/images/illustrations/5.svg"
          illustrationDark="/images/illustrations/5-dark.svg"
          title="Nenhuma aprovacao pendente"
          description="Voce nao possui documentos aguardando sua aprovacao no momento."
          action={{
            label: 'Ver tarefas',
            onClick: () => navigate('/tasks'),
          }}
        />
      ) : (
        <div className="grid gap-4">
          {pendingApprovals.map(({ task, document: doc }) => (
            <Card key={`${task.id}-${doc.id}`} className="overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-900/10">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="w-5 h-5 text-amber-600" />
                      {doc.name}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {task.company?.name || 'Sem empresa'}
                      </span>
                      {task.deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {task.formatted_deadline || task.deadline}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                    className="shrink-0"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Ver tarefa
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Task info */}
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tarefa: {task.title}
                  </p>
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Document info */}
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <FileText className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {doc.file_size_bytes && (
                          <span>{formatFileSize(doc.file_size_bytes)}</span>
                        )}
                        {doc.is_obligatory && (
                          <Badge variant="destructive" className="text-xs">
                            Obrigatorio
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    disabled={isDownloading || !doc.document_path}
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span className="ml-1.5 hidden sm:inline">Baixar</span>
                  </Button>
                </div>

                {/* Approval workflow status */}
                {doc.approverSignatures && doc.approverSignatures.length > 0 && (
                  <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <ApprovalWorkflowStatus
                      document={doc}
                      currentUserId={user?.id}
                    />
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(doc)}
                    className={cn(
                      'gap-2',
                      'text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                    )}
                  >
                    <XCircle className="w-4 h-4" />
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => handleApprove(doc)}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aprovar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Approval dialog */}
      <ApprovalDialog
        open={!!approvalDocument}
        onOpenChange={(open) => !open && setApprovalDocument(null)}
        document={approvalDocument}
        action={approvalAction}
        onSuccess={handleApprovalSuccess}
      />
    </div>
  );
}
