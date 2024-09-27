import React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ChatContainer({ children, theme }: { children: React.ReactNode, theme: string }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme={theme}>
      {children}
    </NextThemesProvider>
  );
}
