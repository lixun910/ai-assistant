import React, { useEffect, useState } from 'react';
import { Button, Tooltip, ScrollShadow, Badge } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { cn } from './cn';
import PromptInput from './prompt-input';
import VoiceChatButton from './voice-chat-button';

type PromptInputWithBottomActionsProps = {
  ideas?: {title: string; description: string}[];
  onSendMessage: (message: string) => void;
  onVoiceMessage: (voice: Blob) => Promise<string>;
  onScreenshotClick?: () => void;
  onRemoveScreenshot?: () => void;
  enableAttachFile?: boolean;
  screenCaptured?: string;
  defaultPromptText?: string;
  status?: 'success' | 'failed' | 'pending';
  onStopChat?: () => void;
  onRestartChat?: () => void;
};

export default function Component({
  ideas,
  onSendMessage,
  onVoiceMessage,
  onScreenshotClick,
  onRemoveScreenshot,
  enableAttachFile,
  screenCaptured,
  defaultPromptText,
  status,
  onStopChat,
  onRestartChat,
}: PromptInputWithBottomActionsProps) {
  const [prompt, setPrompt] = useState<string>('');

  const onSendClick = () => {
    onSendMessage(prompt);
    setPrompt('');
  };

  const onStopClick = () => {
    onStopChat?.();
  };

  const onRestartChatClick = () => {
    onRestartChat?.();
  };

  const [isShiftPressed, setIsShiftPressed] = React.useState(false);

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.shiftKey) {
      setIsShiftPressed(true);
    }
    if (event.key === 'Enter' && isShiftPressed) {
      if (prompt.length > 0) {
        onSendClick();
      }
      // prevent new line
      event.preventDefault();
    }
  };

  const onKeyUp = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.shiftKey) {
      setIsShiftPressed(false);
    }
  };

  const onClickIdea = (e: React.MouseEvent<HTMLButtonElement>) => {
    const { textContent } = e.currentTarget;
    setPrompt(textContent || '');
  };

  const onRecordingComplete = async (voiceBlob: Blob) => {
    const voice = await onVoiceMessage(voiceBlob);
    setPrompt(voice);
  };

  // if screenCaptured is not empty and defaultPromptText is empty, send it
  useEffect(() => {
    if (
      screenCaptured &&
      screenCaptured.length > 0 &&
      defaultPromptText &&
      defaultPromptText.length > 0
    ) {
      onSendMessage(defaultPromptText);
      onRemoveScreenshot?.();
    }
  }, [screenCaptured, defaultPromptText, onSendClick]);

  return (
    <div className="flex w-full flex-col gap-4">
      <ScrollShadow
        hideScrollBar
        className="flex flex-nowrap gap-2"
        orientation="horizontal"
      >
        <div className="flex gap-2">
          {ideas?.map(({ title, description }, index) => (
            <Button
              onClick={onClickIdea}
              key={index}
              className="flex h-14 flex-col items-start gap-0"
              variant="flat"
            >
              <p>{title}</p>
              <p className="text-default-500">{description}</p>
            </Button>
          ))}
        </div>
      </ScrollShadow>
      <form className="flex w-full flex-col items-start rounded-medium bg-default-100 transition-colors hover:bg-default-200/70">
        <div className="group flex gap-2 px-4 pt-4">
          {screenCaptured && screenCaptured.length > 0 && (
            <Badge
              isOneChar
              className="opacity-0 group-hover:opacity-100"
              content={
                <Button
                  isIconOnly
                  radius="full"
                  size="sm"
                  variant="light"
                  data-testid="removescreenshot-button"
                  onPress={onRemoveScreenshot}
                >
                  <Icon
                    className="text-foreground"
                    icon="iconamoon:close-thin"
                    width={16}
                  />
                </Button>
              }
            >
              <img
                className="h-14 w-14 rounded-small border-small border-default-200/50 object-cover"
                src={screenCaptured}
              />
            </Badge>
          )}
        </div>
        <PromptInput
          classNames={{
            inputWrapper: '!bg-transparent shadow-none',
            innerWrapper: 'relative',
            input: 'pt-1 pl-2 pb-6 !pr-10 text-medium',
          }}
          endContent={
            <div className="flex items-end gap-2">
              <Tooltip
                showArrow
                content={status === 'pending' ? 'Stop chat' : 'Send message'}
              >
                <Button
                  isIconOnly
                  color={prompt || status === 'pending' ? 'primary' : 'default'}
                  isDisabled={!prompt && status !== 'pending'}
                  radius="lg"
                  size="sm"
                  variant="solid"
                  data-testid="send-button"
                  onClick={status === 'pending' ? onStopClick : onSendClick}
                >
                  <Icon
                    className={cn(
                      '[&>path]:stroke-[2px]',
                      prompt || status === 'pending'
                        ? 'text-primary-foreground'
                        : 'text-default-600'
                    )}
                    icon={
                      status === 'pending'
                        ? 'gravity-ui:stop'
                        : 'solar:arrow-up-linear'
                    }
                    width={20}
                  />
                </Button>
              </Tooltip>
            </div>
          }
          minRows={3}
          radius="lg"
          value={prompt}
          variant="flat"
          onValueChange={setPrompt}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          disabled={status === 'pending'}
        />
        <div className="flex w-full items-center justify-between  gap-2 overflow-scroll px-4 pb-4">
          <div className="flex w-full gap-1 md:gap-3">
            <Button
              size="sm"
              startContent={
                <Icon
                  className="text-default-500"
                  icon="solar:gallery-minimalistic-linear"
                  width={18}
                />
              }
              variant="flat"
              onClick={onScreenshotClick}
            >
              Screenshot to Ask
            </Button>
            <VoiceChatButton onRecordingComplete={onRecordingComplete} />
            {enableAttachFile && (
              <>
                <Button
                  size="sm"
                  startContent={
                    <Icon
                      className="text-default-500"
                      icon="solar:paperclip-linear"
                      width={18}
                    />
                  }
                  variant="flat"
                >
                  Attach
                </Button>
              </>
            )}
            <Tooltip content="Restart chat">
              <Button
                isIconOnly
                radius="full"
                size="sm"
                variant="light"
                onPress={onRestartChatClick}
                data-testid="restart-button"
              >
                <Icon
                  className="text-lg text-default-600"
                  icon="lucide:list-restart"
                />
              </Button>
            </Tooltip>
          </div>
          <p className="py-1 text-tiny text-default-400">
            {prompt.length}/2000
          </p>
        </div>
      </form>
    </div>
  );
}
