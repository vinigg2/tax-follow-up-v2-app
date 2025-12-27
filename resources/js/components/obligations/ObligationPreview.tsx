import { useMemo } from 'react';
import { CalendarDays, FileText } from 'lucide-react';
import { ObligationFrequency } from '@/api/obligations';

interface ObligationPreviewProps {
  frequency: ObligationFrequency;
  dayDeadline: number;
  monthDeadline?: number;
  period: number;
}

export function ObligationPreview({
  frequency,
  dayDeadline,
  monthDeadline,
  period,
}: ObligationPreviewProps) {
  const preview = useMemo(() => {
    const now = new Date();
    let competency: string;
    let deadline: Date;

    // Calcular competencia baseado no periodo e frequencia
    if (frequency === 'MM') {
      // Mensal
      const targetMonth = new Date(now.getFullYear(), now.getMonth() + period, 1);
      competency = `${targetMonth.getFullYear()}/${String(targetMonth.getMonth() + 1).padStart(2, '0')}`;

      // Prazo é no mes seguinte ao da competencia
      const deadlineMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1);
      const lastDayOfMonth = new Date(deadlineMonth.getFullYear(), deadlineMonth.getMonth() + 1, 0).getDate();
      const day = Math.min(dayDeadline, lastDayOfMonth);
      deadline = new Date(deadlineMonth.getFullYear(), deadlineMonth.getMonth(), day);
    } else if (frequency === 'QT') {
      // Trimestral
      const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
      const targetQuarter = currentQuarter + period;
      const adjustedQuarter = ((targetQuarter - 1) % 4) + 1;
      const yearOffset = Math.floor((targetQuarter - 1) / 4);
      const targetYear = now.getFullYear() + yearOffset;

      competency = `${targetYear}/${adjustedQuarter}T`;

      // Prazo é no mes seguinte ao fim do trimestre
      const quarterEndMonth = adjustedQuarter * 3;
      const deadlineMonth = quarterEndMonth + 1;
      const deadlineYear = deadlineMonth > 12 ? targetYear + 1 : targetYear;
      const adjustedDeadlineMonth = deadlineMonth > 12 ? deadlineMonth - 12 : deadlineMonth;

      const lastDayOfMonth = new Date(deadlineYear, adjustedDeadlineMonth, 0).getDate();
      const day = Math.min(dayDeadline, lastDayOfMonth);
      deadline = new Date(deadlineYear, adjustedDeadlineMonth - 1, day);
    } else {
      // Anual
      const targetYear = now.getFullYear() + period;
      competency = `${targetYear}`;

      // Prazo é no ano seguinte, no mes especificado
      const deadlineYear = targetYear + 1;
      const deadlineMonthIndex = (monthDeadline || 1) - 1;
      const lastDayOfMonth = new Date(deadlineYear, deadlineMonthIndex + 1, 0).getDate();
      const day = Math.min(dayDeadline, lastDayOfMonth);
      deadline = new Date(deadlineYear, deadlineMonthIndex, day);
    }

    const formattedDeadline = deadline.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    return { competency, formattedDeadline };
  }, [frequency, dayDeadline, monthDeadline, period]);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
            PRE-VISUALIZACAO
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Competencia <span className="font-semibold">{preview.competency}</span> e prazo para
            entrega{' '}
            <span className="font-semibold inline-flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              {preview.formattedDeadline}
            </span>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
