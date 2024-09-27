import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    define: {
      'process.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY),
      'process.env.DASHSCOPE_API_KEY': JSON.stringify(env.DASHSCOPE_API_KEY),
      'process.env.GEMINI_TOKEN': JSON.stringify(env.GEMINI_TOKEN),
    },
    build: {
      lib: {
        entry: 'src/main.tsx',
        name: 'AIAssistant',
        fileName: (format) => `react-ai-assistant.${format}.js`,
        formats: ['es'],
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
          },
        },
      },
    },
  };
});
