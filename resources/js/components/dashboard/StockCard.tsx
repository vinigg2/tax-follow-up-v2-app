import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StockCardProps {
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  title: string;
  subtitle: string;
  value: string;
  change?: number | string;
  trend?: 'up' | 'down';
  loading?: boolean;
  badge?: string;
}

const ArrowUpIcon = () => (
  <svg
    className="fill-current"
    width="13"
    height="12"
    viewBox="0 0 13 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6.06462 1.62393C6.20193 1.47072 6.40135 1.37432 6.62329 1.37432C6.6236 1.37432 6.62391 1.37432 6.62422 1.37432C6.81631 1.37415 7.00845 1.44731 7.15505 1.5938L10.1551 4.5918C10.4481 4.88459 10.4483 5.35946 10.1555 5.65246C9.86273 5.94546 9.38785 5.94562 9.09486 5.65283L7.37329 3.93247L7.37329 10.125C7.37329 10.5392 7.03751 10.875 6.62329 10.875C6.20908 10.875 5.87329 10.5392 5.87329 10.125L5.87329 3.93578L4.15516 5.65281C3.86218 5.94561 3.3873 5.94546 3.0945 5.65248C2.8017 5.35949 2.80185 4.88462 3.09484 4.59182L6.06462 1.62393Z"
      fill=""
    />
  </svg>
);

const ArrowDownIcon = () => (
  <svg
    className="fill-current"
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.31462 10.3761C5.45194 10.5293 5.65136 10.6257 5.87329 10.6257C5.8736 10.6257 5.8739 10.6257 5.87421 10.6257C6.0663 10.6259 6.25845 10.5527 6.40505 10.4062L9.40514 7.4082C9.69814 7.11541 9.69831 6.64054 9.40552 6.34754C9.11273 6.05454 8.63785 6.05438 8.34486 6.34717L6.62329 8.06753L6.62329 1.875C6.62329 1.46079 6.28751 1.125 5.87329 1.125C5.45908 1.125 5.12329 1.46079 5.12329 1.875L5.12329 8.06422L3.40516 6.34719C3.11218 6.05439 2.6373 6.05454 2.3445 6.34752C2.0517 6.64051 2.05185 7.11538 2.34484 7.40818L5.31462 10.3761Z"
      fill=""
    />
  </svg>
);

export default function StockCard({
  icon: Icon,
  iconBg = 'bg-blue-100 dark:bg-blue-900/30',
  iconColor = 'text-blue-600 dark:text-blue-400',
  title,
  subtitle,
  value,
  change,
  trend = 'up',
  loading = false,
  badge,
}: StockCardProps) {
  const isPositive = trend === 'up';
  const changeValue =
    typeof change === 'number' ? Math.abs(change).toFixed(0) : change;
  const showChange = change !== undefined && change !== null && change !== 0;

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white px-6 pb-5 pt-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="animate-pulse">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <div className="flex items-end justify-between">
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-6 pb-5 pt-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6 flex items-center gap-3">
        <div
          className={cn(
            'h-10 w-10 flex items-center justify-center rounded-xl',
            iconBg
          )}
        >
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>

        <div>
          <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">
            {title}
          </h3>
          <span className="block text-xs text-gray-500 dark:text-gray-400">
            {subtitle}
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            {value}
          </h4>
        </div>

        {showChange && (
          <span
            className={cn(
              'flex items-center gap-1 rounded-full py-0.5 pl-2 pr-2.5 text-sm font-medium',
              isPositive
                ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500'
                : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'
            )}
          >
            {isPositive ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {changeValue} {typeof change === 'number' ? 'novas' : ''}
          </span>
        )}

        {badge && !showChange && (
          <span className="rounded-full py-0.5 px-2.5 text-sm font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
