import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  documentsApi,
  Document,
  DocumentResponse,
  DownloadUrlResponse,
} from '@/api/documents';

/**
 * Fetch a single document with full details
 */
export function useDocument(id: number | string | undefined) {
  return useQuery<DocumentResponse>({
    queryKey: ['document', id],
    queryFn: () => documentsApi.get(id!),
    enabled: !!id,
  });
}

/**
 * Upload a file to a document with progress tracking
 */
export function useUploadDocument() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<number>(0);

  const mutation = useMutation({
    mutationFn: async ({
      documentId,
      file,
    }: {
      documentId: number | string;
      file: File;
    }) => {
      setProgress(0);
      return documentsApi.upload(documentId, file, (percent) => {
        setProgress(percent);
      });
    },
    onSuccess: (data) => {
      // Invalidate document and related task queries
      queryClient.invalidateQueries({ queryKey: ['document', data.document.id] });
      queryClient.invalidateQueries({ queryKey: ['document', String(data.document.id)] });
      queryClient.invalidateQueries({ queryKey: ['task', data.document.task_id] });
      queryClient.invalidateQueries({ queryKey: ['task', String(data.document.task_id)] });
      queryClient.invalidateQueries({ queryKey: ['task-timeline', data.document.task_id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onSettled: () => {
      // Reset progress after a short delay
      setTimeout(() => setProgress(0), 500);
    },
  });

  return {
    ...mutation,
    progress,
  };
}

/**
 * Approve a document
 */
export function useApproveDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      comment,
    }: {
      documentId: number | string;
      comment?: string;
    }) => documentsApi.approve(documentId, comment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['document', data.document.id] });
      queryClient.invalidateQueries({ queryKey: ['document', String(data.document.id)] });
      queryClient.invalidateQueries({ queryKey: ['task', data.document.task_id] });
      queryClient.invalidateQueries({ queryKey: ['task', String(data.document.task_id)] });
      queryClient.invalidateQueries({ queryKey: ['task-timeline', data.document.task_id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Reject a document
 */
export function useRejectDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      comment,
    }: {
      documentId: number | string;
      comment: string;
    }) => documentsApi.reject(documentId, comment),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['document', data.document.id] });
      queryClient.invalidateQueries({ queryKey: ['document', String(data.document.id)] });
      queryClient.invalidateQueries({ queryKey: ['task', data.document.task_id] });
      queryClient.invalidateQueries({ queryKey: ['task', String(data.document.task_id)] });
      queryClient.invalidateQueries({ queryKey: ['task-timeline', data.document.task_id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Reset a document (delete file, clear approvals)
 */
export function useResetDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: number | string) => documentsApi.reset(documentId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['document', data.document.id] });
      queryClient.invalidateQueries({ queryKey: ['document', String(data.document.id)] });
      queryClient.invalidateQueries({ queryKey: ['task', data.document.task_id] });
      queryClient.invalidateQueries({ queryKey: ['task', String(data.document.task_id)] });
      queryClient.invalidateQueries({ queryKey: ['task-timeline', data.document.task_id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

/**
 * Download a document - returns function that triggers download
 */
export function useDownloadDocument() {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = useCallback(async (documentId: number | string, filename?: string) => {
    setIsDownloading(true);
    try {
      const response = await documentsApi.getDownloadUrl(documentId);

      // Open in new tab or trigger download
      const link = document.createElement('a');
      link.href = response.download_url;
      link.target = '_blank';
      if (filename) {
        link.download = filename;
      }
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  }, []);

  return {
    download,
    isDownloading,
  };
}
