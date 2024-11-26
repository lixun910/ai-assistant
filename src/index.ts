export { GPTAssistant } from './llm/chatgpt';

export { OllamaAssistant } from './llm/ollama';

export { GoogleAssistant } from './llm/google';

export { AiAssistant } from './components/assistant';

export { ScreenshotWrapper } from './components/screenshot-wrapper';
export * from './types';

export { useAssistant } from './hooks/use-assistant';

export {
  testApiKey,
  testOpenAIChatGPTConnection,
  testGeminiConnection,
  testOllamConnection,
} from './utils/connection-test';

export { histogramFunctionDefinition } from './addons/plots/histogram';
