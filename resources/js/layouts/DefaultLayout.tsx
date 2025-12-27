import { HelmetProvider } from 'react-helmet-async';
import { ThemeProvider } from 'next-themes';
import { LayoutProvider } from './components/context';
import { Main } from './components/main';

export function DefaultLayout() {
  return (
    <HelmetProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <LayoutProvider>
          <Main />
        </LayoutProvider>
      </ThemeProvider>
    </HelmetProvider>
  );
}
