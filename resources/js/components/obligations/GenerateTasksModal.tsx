import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useGenerateTasks, useObligationCompanies } from '@/hooks/useObligations';
import { useCompanies } from '@/hooks/useCompanies';
import { Obligation } from '@/api/obligations';
import { Loader2, Building2, Calendar, AlertCircle } from 'lucide-react';

interface GenerateTasksModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  obligation: Obligation | null;
}

export function GenerateTasksModal({
  open,
  onOpenChange,
  obligation,
}: GenerateTasksModalProps) {
  const { t } = useTranslation();
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: companiesData, isLoading: loadingCompanies } = useCompanies();
  const generateTasks = useGenerateTasks();

  const companies = companiesData?.companies || [];

  // Set default dates when modal opens
  useEffect(() => {
    if (open && obligation) {
      // Default to current month for start date
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);

      // Default to 3 months from now for end date
      const endOfRange = new Date(now.getFullYear(), now.getMonth() + 3, 0);
      setEndDate(endOfRange.toISOString().split('T')[0]);

      // Select all companies by default
      setSelectedCompanyIds(companies.map((c) => c.id));
    }
  }, [open, obligation, companies]);

  const handleToggleCompany = (companyId: number) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(companyId)
        ? prev.filter((id) => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleToggleAll = () => {
    if (selectedCompanyIds.length === companies.length) {
      setSelectedCompanyIds([]);
    } else {
      setSelectedCompanyIds(companies.map((c) => c.id));
    }
  };

  const generateCompetencies = (): string[] => {
    if (!startDate || !endDate || !obligation) return [];

    const competencies: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let current = new Date(start.getFullYear(), start.getMonth(), 1);

    while (current <= end) {
      if (obligation.frequency === 'MM') {
        // Monthly: add each month
        competencies.push(current.toISOString().split('T')[0]);
        current.setMonth(current.getMonth() + 1);
      } else if (obligation.frequency === 'QT') {
        // Quarterly: add every 3 months starting from Jan, Apr, Jul, Oct
        const quarterMonth = Math.floor(current.getMonth() / 3) * 3;
        const quarterDate = new Date(current.getFullYear(), quarterMonth, 1);
        if (quarterDate >= start && quarterDate <= end) {
          const isoDate = quarterDate.toISOString().split('T')[0];
          if (!competencies.includes(isoDate)) {
            competencies.push(isoDate);
          }
        }
        current.setMonth(current.getMonth() + 3);
      } else if (obligation.frequency === 'AA') {
        // Annual: add January of each year
        const annualDate = new Date(current.getFullYear(), 0, 1);
        if (annualDate >= start && annualDate <= end) {
          const isoDate = annualDate.toISOString().split('T')[0];
          if (!competencies.includes(isoDate)) {
            competencies.push(isoDate);
          }
        }
        current.setFullYear(current.getFullYear() + 1);
      } else {
        break;
      }
    }

    return competencies;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!obligation) return;

    if (selectedCompanyIds.length === 0) {
      toast.error(t('obligations.selectAtLeastOneCompany'));
      return;
    }

    const competencies = generateCompetencies();
    if (competencies.length === 0) {
      toast.error(t('obligations.invalidDateRange'));
      return;
    }

    try {
      const result = await generateTasks.mutateAsync({
        id: obligation.id,
        data: {
          company_ids: selectedCompanyIds,
          competencies,
        },
      });
      toast.success(t('toast.tasksGenerated', { count: result.count || 0 }));
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error generating tasks:', error);
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(t('toast.errorGeneratingTasks'));
      }
    }
  };

  const competencies = generateCompetencies();
  const estimatedTasks = competencies.length * selectedCompanyIds.length;
  const isLoading = generateTasks.isPending;
  const canSubmit = selectedCompanyIds.length > 0 && competencies.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('obligations.generateTasks')}</DialogTitle>
          <DialogDescription>
            {obligation?.title} - {t('obligations.selectCompaniesAndPeriod')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogBody className="space-y-6">
            {/* Date Range Selection */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {t('obligations.period')}
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t('obligations.startDate')}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">{t('obligations.endDate')}</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    required
                  />
                </div>
              </div>

              {competencies.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('obligations.competenciesCount', { count: competencies.length })}
                </p>
              )}
            </div>

            {/* Company Selection */}
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {t('obligations.companies')}
                </h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleAll}
                >
                  {selectedCompanyIds.length === companies.length
                    ? t('common.none')
                    : t('common.all')}
                </Button>
              </div>

              {loadingCompanies ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : companies.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{t('obligations.noCompaniesAvailable')}</p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  {companies.map((company) => (
                    <label
                      key={company.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedCompanyIds.includes(company.id)}
                        onCheckedChange={() => handleToggleCompany(company.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {company.name}
                        </p>
                        {company.cnpj && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {company.cnpj}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('obligations.selectedCompanies', { count: selectedCompanyIds.length })}
              </p>
            </div>

            {/* Estimate */}
            {canSubmit && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('obligations.estimatedTasks', { count: estimatedTasks })}
                </p>
              </div>
            )}
          </DialogBody>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !canSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {t('obligations.generateTasks')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
