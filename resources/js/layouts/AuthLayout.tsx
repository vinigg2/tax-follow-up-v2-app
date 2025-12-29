import { Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider, useTheme } from 'next-themes';
import { generalSettings } from '@/config/menu.config';

function AuthContent() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="min-h-screen flex">
      {/* Coluna Esquerda - Branding */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-primary flex-col justify-center items-center p-12"
        style={{
          backgroundImage: `url('/images/${isDark ? 'mask-darkness-bg.png' : 'mask-bg.png'}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="max-w-lg text-center">
          {/* Ilustracao com animacao */}
          <div className="relative">
            <img
              src={`/images/illustrations/${isDark ? '1-dark' : '1'}.svg`}
              alt="Ilustracao"
              className="w-full max-w-md mx-auto mb-10 animate-float"
            />
            {/* Sombra animada */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-4 bg-black/20 rounded-full blur-xl animate-shadow" />
          </div>

          {/* Texto de destaque */}
          <h1 className="text-3xl font-bold text-white mb-4">
            Gerencie suas obrigacoes fiscais com eficiencia
          </h1>
          <p className="text-lg text-white/80">
            Automatize tarefas, acompanhe prazos e mantenha sua equipe organizada
            com o {generalSettings.appName}.
          </p>
        </div>

        {/* Footer da coluna */}
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-sm text-white/60">
            &copy; {new Date().getFullYear()} {generalSettings.appName}. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Coluna Direita - Formulario */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function AuthLayout() {
  return (
    <HelmetProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AuthContent />
      </ThemeProvider>
    </HelmetProvider>
  );
}
