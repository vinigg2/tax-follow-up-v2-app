import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from 'next-themes';
import { LayoutProvider } from './components/context';
import { Main } from './components/main';
import { AIProvider } from '@/context/AIContext';
import { AIChatWidget } from '@/components/ai';

export function DefaultLayout() {
  return (
    <HelmetProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <AIProvider>
          <LayoutProvider>
            <Main />
            <AIChatWidget />
          </LayoutProvider>
        </AIProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
