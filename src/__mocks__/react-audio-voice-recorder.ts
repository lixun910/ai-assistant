export const useAudioRecorder = () => {
  return {
    isRecording: false,
    recordingBlob: new Blob(['test'], { type: 'audio/wav' }),
    startRecording: jest.fn(),
    stopRecording: jest.fn(() => new Blob(['test'], { type: 'audio/wav' })),
  };
};
