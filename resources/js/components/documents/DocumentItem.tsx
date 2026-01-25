import { useState } from 'react';
import {
  FileText,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Document,
  DocumentStatus,
  DOCUMENT_STATUS_CONFIG,
  formatFileSize,
} from '@/api/documents';

interface DocumentItemProps {
  document: Document;
  currentUserId?: number;
  isGroupAdmin?: boolean;
  onUpload: (document: Document) => void;
  onDownload: (document: Document) => void;
  onApprove?: (document: Document) => void;
  onReject?: (document: Document) => void;
  onReset?: (document: Document) => void;
  isDownloading?: boolean;
}

const STATUS_ICONS: Record<DocumentStatus, typeof FileText> = {
  unstarted: Clock,
  started: Clock,
  on_approval: AlertCircle,
  finished: CheckCircle,
  restarted: RefreshCw,
};

const STATUS_COLORS: Record<DocumentStatus, string> = {
  unstarted: 'text-gray-400',
  started: 'text-blue-500',
  on_approval: 'text-amber-500',
  finished: 'text-green-500',
  restarted: 'text-purple-500',
};

const STATUS_BG_COLORS: Record<DocumentStatus, string> = {
  unstarted: 'bg-gray-100 dark:bg-gray-800',
  started: 'bg-blue-100 dark:bg-blue-900/30',
  on_approval: 'bg-amber-100 dark:bg-amber-900/30',
  finished: 'bg-green-100 dark:bg-green-900/30',
  restarted: 'bg-purple-100 dark:bg-purple-900/30',
};

export function DocumentItem({
  document,
  currentUserId,
  isGroupAdmin = false,
  onUpload,
  onDownload,
  onApprove,
  onReject,
  onReset,
  isDownloading = false,
}: DocumentItemProps) {
  const StatusIcon = STATUS_ICONS[document.status] || FileText;
  const statusConfig = DOCUMENT_STATUS_CONFIG[document.status];

  // Check if current user has a pending approval for this document
  const pendingSignature = document.approverSignatures?.find(
    (sig) => sig.user_id === currentUserId && sig.status === 'pending'
  );

  // Check if document is awaiting approval
  const needsApproval =
    document.status === 'on_approval' && document.approval_required !== 'N';

  // Can approve if: has pending signature OR (is admin/manager AND document needs approval)
  const canApprove = !!pendingSignature || (isGroupAdmin && needsApproval);

  const hasFile = !!document.document_path;
  const needsUpload = document.status === 'unstarted' || document.status === 'restarted';

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border transition-colors',
        document.is_obligatory
          ? 'border-l-4 border-l-red-500 border-gray-200 dark:border-gray-700'
          : 'border-gray-200 dark:border-gray-700'
      )}
    >
      {/* Left side: Icon and info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Status icon */}
        <div
          className={cn(
            'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
            STATUS_BG_COLORS[document.status]
          )}
        >
          <StatusIcon className={cn('w-5 h-5', STATUS_COLORS[document.status])} />
        </div>

        {/* Document info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {document.name}
            </p>
            {document.is_obligatory && (
              <Badge variant="destructive" className="shrink-0 text-xs">
                Obrigatorio
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant="outline"
              className={cn(
                'text-xs',
                document.status === 'finished' && 'border-green-300 text-green-700 dark:text-green-400',
                document.status === 'on_approval' && 'border-amber-300 text-amber-700 dark:text-amber-400',
                document.status === 'restarted' && 'border-purple-300 text-purple-700 dark:text-purple-400'
              )}
            >
              {statusConfig?.label || document.status}
            </Badge>

            {hasFile && document.file_size_bytes && (
              <span className="text-xs text-gray-500">
                {formatFileSize(document.file_size_bytes)}
              </span>
            )}

            {canApprove && (
              <Badge className="bg-amber-500 text-white text-xs animate-pulse">
                {pendingSignature ? 'Aguardando sua aprovacao' : 'Aprovar como admin'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Upload button - show when needs upload */}
        {needsUpload && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpload(document)}
            className="gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </Button>
        )}

        {/* Download button - show when has file */}
        {hasFile && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload(document)}
            disabled={isDownloading}
            className="gap-1.5"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Baixar</span>
          </Button>
        )}

        {/* Approve/Reject buttons - show when can approve */}
        {canApprove && onApprove && onReject && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApprove(document)}
              className="gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Aprovar</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject(document)}
              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <XCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Rejeitar</span>
            </Button>
          </>
        )}

        {/* More actions dropdown */}
        {(hasFile || document.status !== 'unstarted') && onReset && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasFile && (
                <DropdownMenuItem onClick={() => onDownload(document)}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar arquivo
                </DropdownMenuItem>
              )}
              {document.status !== 'finished' && (
                <DropdownMenuItem
                  onClick={() => onReset(document)}
                  className="text-red-600 focus:text-red-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reiniciar documento
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
