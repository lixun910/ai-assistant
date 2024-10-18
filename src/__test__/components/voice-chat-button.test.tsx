/**
 * @jest-environment jsdom
 */
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
jest.mock('react-audio-voice-recorder');

import VoiceChatButton from '../../components/voice-chat-button';
import { useAudioRecorder } from 'react-audio-voice-recorder';

(useAudioRecorder as jest.Mock).mockReturnValue({
  isRecording: false,
  recordingBlob: new Blob(['test'], { type: 'audio/wav' }),
  startRecording: jest.fn(),
  stopRecording: jest.fn(() => new Blob(['test'], { type: 'audio/wav' })),
});

describe('VoiceChatButton', () => {
  it('renders correctly', () => {
    // override the default mock for useAudioRecorder
    const { container } = render(
      <VoiceChatButton onRecordingComplete={() => Promise.resolve()} />
    );
    expect(container).toMatchSnapshot();
  });

  it('starts recording on button click', () => {
    const { startRecording } = useAudioRecorder();
    render(<VoiceChatButton onRecordingComplete={jest.fn()} />);

    fireEvent.click(screen.getByText('Talk to Ask'));
    expect(startRecording).toHaveBeenCalled();
  });

  it('stops recording on button click when already recording', () => {
    const { stopRecording } = useAudioRecorder();
    render(<VoiceChatButton onRecordingComplete={jest.fn()} />);

    fireEvent.click(screen.getByText('Talk to Ask'));
    fireEvent.click(screen.getByText('Talk to Ask'));
    expect(stopRecording).toHaveBeenCalled();
  });

  it('calls onRecordingComplete with the recording blob', async () => {
    const mockOnRecordingComplete = jest.fn();
    render(<VoiceChatButton onRecordingComplete={mockOnRecordingComplete} />);

    fireEvent.click(screen.getByText('Talk to Ask')); // Start recording
    fireEvent.click(screen.getByText('Talk to Ask')); // Stop recording

    expect(mockOnRecordingComplete).toHaveBeenCalledWith(expect.any(Blob));
  });
});
