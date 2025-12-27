import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  illustration?: string;
  illustrationDark?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
  className?: string;
}

export function EmptyState({
  illustration,
  illustrationDark,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4', className)}>
      {illustration && (
        <div className="mb-6">
          {illustrationDark ? (
            <>
              <img
                src={illustration}
                alt=""
                className="w-48 h-48 object-contain dark:hidden"
              />
              <img
                src={illustrationDark}
                alt=""
                className="w-48 h-48 object-contain hidden dark:block"
              />
            </>
          ) : (
            <img
              src={illustration}
              alt=""
              className="w-48 h-48 object-contain"
            />
          )}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
        {title}
      </h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <Button onClick={action.onClick} className="mt-6">
          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
