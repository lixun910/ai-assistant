import { AiAssistant } from './components/assistant';
import { ScreenshotWrapper } from './components/screenshot-wrapper';
import { useState } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function App() {
  const [startScreenCapture, setStartScreenCapture] = useState(false);
  const [screenCaptured, setScreenCaptured] = useState('');

  return (
    <NextThemesProvider attribute="class" defaultTheme={'dark'}>
      <div>
        <ScreenshotWrapper
          setScreenCaptured={setScreenCaptured}
          startScreenCapture={startScreenCapture}
          setStartScreenCapture={setStartScreenCapture}
        >
          <div className="h-[600px] w-[400px] m-4">
            <AiAssistant
              theme="dark"
              modelProvider="google"
              model="gemini-1.5-flash"
              apiKey={process.env.GEMINI_TOKEN || ''}
              welcomeMessage="Hi, I am your assistant. How can I help you today?"
              instructions=""
              functions={[]}
              screenCapturedBase64={screenCaptured}
              onScreenshotClick={() => setStartScreenCapture(true)}
              onRemoveScreenshot={() => setScreenCaptured('')}
            />
          </div>
        </ScreenshotWrapper>
      </div>
    </NextThemesProvider>
  );
}
