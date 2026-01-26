import { AlertTriangle, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AIAction } from '@/types/ai';

interface AIActionConfirmationProps {
  action: AIAction;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AIActionConfirmation({
  action,
  onConfirm,
  onCancel,
}: AIActionConfirmationProps) {
  return (
    <div className="mx-4 mb-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm text-amber-700">
            Confirmar acao
          </h4>
          <p className="text-sm text-amber-600 mt-1">
            {action.description}
          </p>

          {/* Action details */}
          {action.data && (
            <div className="mt-2 p-2 bg-background rounded border text-xs font-mono overflow-x-auto">
              <pre>{JSON.stringify(action.data, null, 2)}</pre>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={onConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
            >
              <X className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
