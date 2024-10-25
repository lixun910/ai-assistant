import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  verbose: true,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
      },
    ],
  },
  moduleNameMapper: {
    'react-audio-voice-recorder':
      '<rootDir>/src/__mocks__/react-audio-voice-recorder.ts',
    'iconify-icon': '<rootDir>/src/__mocks__/iconify.tsx',
    '@langchain/google-genai': '<rootDir>/src/__mocks__/google-genai.ts',
    '@langchain/ollama': '<rootDir>/src/__mocks__/ollama.ts',
    '@langchain/core/runnables':
      '<rootDir>/src/__mocks__/runnable.ts',
    openai: '<rootDir>/src/__mocks__/openai.ts',
  },
  setupFiles: ['<rootDir>/src/jest/jest.setup.ts'],
  coverageDirectory: 'coverage', // Added coverageDirectory option
};

export default config;
