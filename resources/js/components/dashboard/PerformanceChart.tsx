import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useDashboardChartData } from '@/hooks/useDashboard';

interface ChartDataPoint {
  name: string;
  concluidas: number;
  pendentes: number;
  atrasadas: number;
}

interface PerformanceChartProps {
  data?: ChartDataPoint[];
  loading?: boolean;
}

type PeriodKey = 'monthly' | 'quarterly' | 'annually';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'monthly', label: 'Mensal' },
  { key: 'quarterly', label: 'Trimestral' },
  { key: 'annually', label: 'Anual' },
];

export default function PerformanceChart({
  data: externalData,
  loading: externalLoading = false,
}: PerformanceChartProps) {
  const [period, setPeriod] = useState<PeriodKey>('monthly');
  const { data: chartResponse, isLoading: chartLoading } = useDashboardChartData(period);

  const loading = externalLoading || chartLoading;
  const data = externalData || chartResponse?.data || [];

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
          <div className="animate-pulse flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-4 w-60 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
            <div className="h-10 w-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
        <div className="p-6">
          <div className="h-80 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-800 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Performance de Tarefas
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Acompanhe a evolucao das tarefas ao longo do tempo
          </p>
        </div>

        {/* Period Toggle */}
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                period === p.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorConcluidas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorPendentes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAtrasadas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200 dark:stroke-gray-700"
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                formatter={(value: string) => (
                  <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                    {value}
                  </span>
                )}
              />
              <Area
                type="monotone"
                dataKey="concluidas"
                name="Concluidas"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#colorConcluidas)"
              />
              <Area
                type="monotone"
                dataKey="pendentes"
                name="Pendentes"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#colorPendentes)"
              />
              <Area
                type="monotone"
                dataKey="atrasadas"
                name="Atrasadas"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#colorAtrasadas)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
