import { CheckCircle, XCircle, Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/helpers';
import { Document, ApprovalType, APPROVAL_TYPE_CONFIG } from '@/api/documents';

interface ApprovalWorkflowStatusProps {
  document: Document;
  currentUserId?: number;
  compact?: boolean;
}

export function ApprovalWorkflowStatus({
  document,
  currentUserId,
  compact = false,
}: ApprovalWorkflowStatusProps) {
  const approvalConfig = APPROVAL_TYPE_CONFIG[document.approval_required];
  const signatures = document.approverSignatures || [];

  // No approval required
  if (document.approval_required === 'N' || signatures.length === 0) {
    return null;
  }

  // Sort by sequence for display
  const sortedSignatures = [...signatures].sort((a, b) => a.sequence - b.sequence);

  if (compact) {
    // Compact view: just show icons
    const approvedCount = signatures.filter((s) => s.status === 'signed').length;
    const rejectedCount = signatures.filter((s) => s.status === 'rejected').length;
    const pendingCount = signatures.filter((s) => s.status === 'pending').length;

    return (
      <div className="flex items-center gap-1.5">
        {approvedCount > 0 && (
          <div className="flex items-center gap-0.5 text-green-600">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{approvedCount}</span>
          </div>
        )}
        {rejectedCount > 0 && (
          <div className="flex items-center gap-0.5 text-red-600">
            <XCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{rejectedCount}</span>
          </div>
        )}
        {pendingCount > 0 && (
          <div className="flex items-center gap-0.5 text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">{pendingCount}</span>
          </div>
        )}
      </div>
    );
  }

  // Full view: show each approver
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Fluxo de Aprovacao
        </h4>
        <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
          {approvalConfig.label}
        </span>
      </div>

      {/* Sequential: Stepper */}
      {document.approval_required === 'S' && (
        <div className="space-y-2">
          {sortedSignatures.map((sig, index) => {
            const isCurrentUser = sig.user_id === currentUserId;
            const isSigned = sig.status === 'signed';
            const isRejected = sig.status === 'rejected';
            const isPending = sig.status === 'pending';
            const isWaiting = sig.status === null;

            return (
              <div key={sig.id} className="flex items-start gap-3">
                {/* Step indicator */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                      isSigned && 'bg-green-100 dark:bg-green-900/30 text-green-600',
                      isRejected && 'bg-red-100 dark:bg-red-900/30 text-red-600',
                      isPending && 'bg-amber-100 dark:bg-amber-900/30 text-amber-600',
                      isWaiting && 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    )}
                  >
                    {isSigned ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : isRejected ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {/* Connector line */}
                  {index < sortedSignatures.length - 1 && (
                    <div
                      className={cn(
                        'w-0.5 h-6 mt-1',
                        isSigned ? 'bg-green-300 dark:bg-green-700' : 'bg-gray-200 dark:bg-gray-700'
                      )}
                    />
                  )}
                </div>

                {/* Approver info */}
                <div className="flex-1 pb-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">
                        {sig.user ? getInitials(sig.user.name, 2) : <User className="w-3 h-3" />}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        'text-sm font-medium',
                        isCurrentUser && 'text-blue-600 dark:text-blue-400'
                      )}
                    >
                      {sig.user?.name || 'Usuario'}
                      {isCurrentUser && ' (voce)'}
                    </span>
                  </div>

                  {/* Status label */}
                  <p
                    className={cn(
                      'text-xs mt-0.5',
                      isSigned && 'text-green-600 dark:text-green-400',
                      isRejected && 'text-red-600 dark:text-red-400',
                      isPending && 'text-amber-600 dark:text-amber-400',
                      isWaiting && 'text-gray-400'
                    )}
                  >
                    {isSigned && 'Aprovado'}
                    {isRejected && 'Rejeitado'}
                    {isPending && 'Aguardando aprovacao'}
                    {isWaiting && 'Aguardando vez'}
                  </p>

                  {/* Comment */}
                  {sig.comment && (
                    <p className="text-xs text-gray-500 mt-1 italic">
                      "{sig.comment}"
                    </p>
                  )}

                  {/* Signed date */}
                  {sig.signed_at && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(sig.signed_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Parallel: Grid */}
      {document.approval_required === 'P' && (
        <div className="grid grid-cols-2 gap-3">
          {sortedSignatures.map((sig) => {
            const isCurrentUser = sig.user_id === currentUserId;
            const isSigned = sig.status === 'signed';
            const isRejected = sig.status === 'rejected';
            const isPending = sig.status === 'pending';

            return (
              <div
                key={sig.id}
                className={cn(
                  'p-3 rounded-lg border',
                  isSigned && 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
                  isRejected && 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
                  isPending && 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800',
                  !isSigned && !isRejected && !isPending && 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                )}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'flex items-center justify-center w-6 h-6 rounded-full',
                      isSigned && 'bg-green-200 dark:bg-green-800',
                      isRejected && 'bg-red-200 dark:bg-red-800',
                      isPending && 'bg-amber-200 dark:bg-amber-800',
                      !isSigned && !isRejected && !isPending && 'bg-gray-200 dark:bg-gray-700'
                    )}
                  >
                    {isSigned ? (
                      <CheckCircle className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                    ) : isRejected ? (
                      <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                    ) : isPending ? (
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-sm font-medium truncate',
                      isCurrentUser && 'text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {sig.user?.name || 'Usuario'}
                  </span>
                </div>

                {sig.comment && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2 italic">
                    "{sig.comment}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
