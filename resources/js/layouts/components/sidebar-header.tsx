import { ChevronFirst } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLayout } from './context';

export function SidebarHeader() {
  const { sidebarCollapse, setSidebarCollapse } = useLayout();

  const handleToggleClick = () => {
    setSidebarCollapse(!sidebarCollapse);
  };

  return (
    <div className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0">
      <Link to="/dashboard" className="flex items-center gap-2">
        <div className="dark:hidden">
          <span className="default-logo text-xl font-bold text-primary">
            Tax Follow-Up
          </span>
          <span className="small-logo text-xl font-bold text-primary">TF</span>
        </div>
        <div className="hidden dark:block">
          <span className="default-logo text-xl font-bold text-primary">
            Tax Follow-Up
          </span>
          <span className="small-logo text-xl font-bold text-primary">TF</span>
        </div>
      </Link>
      <Button
        onClick={handleToggleClick}
        size="sm"
        mode="icon"
        variant="outline"
        className={cn(
          'size-7 absolute start-full top-2/4 rtl:translate-x-2/4 -translate-x-2/4 -translate-y-2/4',
          sidebarCollapse ? 'ltr:rotate-180' : 'rtl:rotate-180',
        )}
      >
        <ChevronFirst className="size-4!" />
      </Button>
    </div>
  );
}
