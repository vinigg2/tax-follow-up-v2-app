import { Outlet } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from 'next-themes';

export function AuthLayout() {
  return (
    <HelmetProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
          <Outlet />
        </div>
      </ThemeProvider>
    </HelmetProvider>
  );
}
