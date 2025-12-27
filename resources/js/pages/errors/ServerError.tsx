import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, RefreshCw } from 'lucide-react';

export default function ServerError() {
  const navigate = useNavigate();

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <img
            src="/images/illustrations/20.svg"
            alt=""
            className="w-64 h-64 mx-auto object-contain dark:hidden"
          />
          <img
            src="/images/illustrations/20-dark.svg"
            alt=""
            className="w-64 h-64 mx-auto object-contain hidden dark:block"
          />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Erro no servidor
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
          Algo deu errado. Por favor, tente novamente mais tarde.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={handleRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
          <Button
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir para o inicio
          </Button>
        </div>
      </div>
    </div>
  );
}
