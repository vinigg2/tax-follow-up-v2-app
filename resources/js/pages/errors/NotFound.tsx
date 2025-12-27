import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="text-center max-w-lg">
        <div className="mb-8">
          <img
            src="/images/illustrations/19.svg"
            alt=""
            className="w-64 h-64 mx-auto object-contain dark:hidden"
          />
          <img
            src="/images/illustrations/18-dark.svg"
            alt=""
            className="w-64 h-64 mx-auto object-contain hidden dark:block"
          />
        </div>

        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Pagina nao encontrada
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">
          A pagina que voce esta procurando nao existe ou foi movida.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
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
