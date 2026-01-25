import { Loader2 } from 'lucide-react';

export function ScreenLoader() {
  return (
    <div className="flex flex-col items-center gap-3 justify-center fixed inset-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm transition-opacity duration-300 ease-in-out">
      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30">
        <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
      </div>
      <div className="text-gray-500 dark:text-gray-400 font-medium text-sm">
        Carregando...
      </div>
    </div>
  );
}
