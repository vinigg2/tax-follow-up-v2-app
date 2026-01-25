import api from './axios';

// Types
export type DocumentStatus = 'unstarted' | 'started' | 'on_approval' | 'finished' | 'restarted';
export type ApprovalType = 'N' | 'S' | 'P'; // None, Sequential, Parallel
export type SignatureStatus = 'pending' | 'signed' | 'rejected' | null;

export interface ApproverSignature {
  id: number;
  user_id: number;
  document_id: number;
  sequence: number;
  status: SignatureStatus;
  comment?: string;
  signed_at?: string;
  user?: {
    id: number;
    name: string;
  };
}

export interface Document {
  id: number;
  name: string;
  description?: string;
  status: DocumentStatus;
  is_obligatory: boolean;
  required_file: boolean;
  approval_required: ApprovalType;
  document_path?: string;
  file_size_bytes?: number;
  submission_date?: string;
  start_date?: string;
  finish_date?: string;
  sender_id?: number;
  task_id: number;
  company_id: number;
  group_id: number;
  document_type_id?: number;
  estimated_days?: number;
  order_items: number;
  sender?: {
    id: number;
    name: string;
  };
  documentType?: {
    id: number;
    name: string;
  };
  approverSignatures?: ApproverSignature[];
}

export interface DocumentResponse {
  document: Document;
  message?: string;
}

export interface DownloadUrlResponse {
  download_url: string;
  expires_at: string;
}

export interface UploadProgressCallback {
  (progress: number): void;
}

// Status display configuration
export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string }> = {
  unstarted: { label: 'Nao Iniciado', color: 'gray' },
  started: { label: 'Em Andamento', color: 'blue' },
  on_approval: { label: 'Em Aprovacao', color: 'amber' },
  finished: { label: 'Finalizado', color: 'green' },
  restarted: { label: 'Rejeitado', color: 'purple' },
};

export const APPROVAL_TYPE_CONFIG: Record<ApprovalType, { label: string; description: string }> = {
  N: { label: 'Sem Aprovacao', description: 'Documento finaliza apos upload' },
  S: { label: 'Sequencial', description: 'Aprovadores em sequencia' },
  P: { label: 'Paralelo', description: 'Todos aprovam simultaneamente' },
};

// Allowed file extensions (from backend config)
export const ALLOWED_EXTENSIONS = [
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'jpg', 'jpeg', 'png', 'gif',
  'zip', 'rar', '7z',
  'txt', 'csv'
];

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
export const MAX_FILE_SIZE_DISPLAY = '50MB';

// Validation helpers
export function validateFileExtension(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext ? ALLOWED_EXTENSIONS.includes(ext) : false;
}

export function validateFileSize(size: number): boolean {
  return size <= MAX_FILE_SIZE_BYTES;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// API functions
export const documentsApi = {
  /**
   * Get a single document with full details
   */
  get: async (id: number | string): Promise<DocumentResponse> => {
    const response = await api.get(`/documents/${id}`);
    return response.data;
  },

  /**
   * Upload a file to a document with progress tracking
   */
  upload: async (
    id: number | string,
    file: File,
    onProgress?: UploadProgressCallback
  ): Promise<DocumentResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/documents/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return response.data;
  },

  /**
   * Get a temporary download URL for the document
   */
  getDownloadUrl: async (id: number | string): Promise<DownloadUrlResponse> => {
    const response = await api.get(`/documents/${id}/download-url`);
    return response.data;
  },

  /**
   * Approve a document (optional comment)
   */
  approve: async (id: number | string, comment?: string): Promise<DocumentResponse> => {
    const response = await api.post(`/documents/${id}/approve`, { comment });
    return response.data;
  },

  /**
   * Reject a document (comment required)
   */
  reject: async (id: number | string, comment: string): Promise<DocumentResponse> => {
    const response = await api.post(`/documents/${id}/reject`, { comment });
    return response.data;
  },

  /**
   * Reset a document (delete file, clear approvals)
   */
  reset: async (id: number | string): Promise<DocumentResponse> => {
    const response = await api.post(`/documents/${id}/reset`);
    return response.data;
  },
};
