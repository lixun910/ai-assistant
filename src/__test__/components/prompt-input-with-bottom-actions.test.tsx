/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React, { act } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PromptInputWithBottomActions from '../../components/prompt-input-with-bottom-actions';

// mock react-audio-voice-recorder used in VoiceChatButton
jest.mock('react-audio-voice-recorder');
import { useAudioRecorder } from 'react-audio-voice-recorder';
(useAudioRecorder as jest.Mock).mockReturnValue({
  isRecording: false,
  recordingBlob: new Blob(['test'], { type: 'audio/wav' }),
  startRecording: jest.fn(),
  stopRecording: jest.fn(() => new Blob(['test'], { type: 'audio/wav' })),
});

// mock iconify
jest.mock('@iconify/react', () => {
  return {
    Icon: ({ ...props }) => <svg data-testid="icon" {...props} />,
  };
});

describe('PromptInputWithBottomActions Component', () => {
  const mockOnSendMessage = jest.fn();
  const mockOnVoiceMessage = jest.fn().mockResolvedValue('Voice message');
  const mockOnScreenshotClick = jest.fn();
  const mockOnRemoveScreenshot = jest.fn();
  const mockOnStopChat = jest.fn();
  const mockOnRestartChat = jest.fn();

  const defaultProps = {
    onSendMessage: mockOnSendMessage,
    onVoiceMessage: mockOnVoiceMessage,
    onScreenshotClick: mockOnScreenshotClick,
    onRemoveScreenshot: mockOnRemoveScreenshot,
    onStopChat: mockOnStopChat,
    onRestartChat: mockOnRestartChat,
    ideas: [{ title: 'Idea 1', description: 'Description 1' }],
    enableAttachFile: false,
    screenCaptured: '',
    defaultPromptText: '',
    status: 'success' as 'success' | 'failed' | 'pending' | undefined,
  };

  it('renders without crashing', () => {
    const container = render(
      <PromptInputWithBottomActions {...defaultProps} />
    );
    expect(container).toMatchSnapshot();

    // check "Screenshot to Ask" button
    expect(screen.getByText('Screenshot to Ask')).toBeInTheDocument();
  });

  it('calls onSendMessage when send button is clicked', () => {
    render(<PromptInputWithBottomActions {...defaultProps} />);

    // Check the send button
    const sendButton = screen.getByTestId('send-button'); // Use a data-testid
    const icon = sendButton.querySelector('.text-default-600');
    expect(icon).toBeInTheDocument();

    // Simulate input message "Test message"
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Test message' } });

    // Simulate send click
    fireEvent.click(sendButton);
    expect(mockOnSendMessage).toHaveBeenCalledWith('Test message');
  });

  it('calls onStopChat when stop button is clicked', () => {
    render(<PromptInputWithBottomActions {...defaultProps} status="pending" />);

    // Check the send button should becomes stop button
    const stopButton = screen.getByTestId('send-button');
    const icon = stopButton.querySelector('.text-primary-foreground');
    expect(icon).toBeInTheDocument();

    // Simulate stop click
    fireEvent.click(stopButton);
    expect(mockOnStopChat).toHaveBeenCalled();
  });

  it('calls onRestartChat when restart button is clicked', () => {
    render(<PromptInputWithBottomActions {...defaultProps} />);
    const restartButton = screen.getByTestId('restart-button');
    fireEvent.click(restartButton);
    expect(mockOnRestartChat).toHaveBeenCalled();
  });

  it('displays ideas and allows clicking on them', () => {
    render(<PromptInputWithBottomActions {...defaultProps} />);
    const ideaButton = screen.getByText('Idea 1');
    fireEvent.click(ideaButton);
    expect(screen.getByRole('textbox')).toHaveValue('Idea 1Description 1');
  });

  it('calls onRemoveScreenshot when remove screenshot button is clicked', () => {
    render(
      <PromptInputWithBottomActions
        {...defaultProps}
        screenCaptured="image.png"
      />
    );
    const removeButton = screen.getByTestId('removescreenshot-button');
    fireEvent.click(removeButton);
    expect(mockOnRemoveScreenshot).toHaveBeenCalled();
  });

  it('calls onSendMessage when screenshot and defaultPromptText are passed', async () => {
    render(
      <PromptInputWithBottomActions
        {...defaultProps}
        screenCaptured="base64image"
        defaultPromptText="how to use this?"
      />
    );
    // Mock useEffect
    jest.spyOn(React, 'useEffect').mockImplementation(f => f());

    // Wait for the next tick to allow useEffect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockOnSendMessage).toHaveBeenCalledWith('how to use this?');
    expect(mockOnRemoveScreenshot).toHaveBeenCalled();
  });
});
