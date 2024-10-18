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
  },
  setupFiles: ['<rootDir>/src/__test__/jest.setup.ts'],
};

export default config;
