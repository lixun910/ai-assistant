import { GPTAssistant } from '../../llm/chatgpt';
import OpenAI from 'openai';
import { mockMutexRelease } from '../../jest/jest.setup';
// Mock OpenAI
jest.mock('openai');

// Mock OpenAI methods
const mockThreadCreate = jest.fn().mockResolvedValue({ id: 'test-thread-id' });
const mockThreadRetrieve = jest.fn().mockResolvedValue(true);
const mockThreadDelete = jest.fn().mockResolvedValue(true);
const mockAssistantUpdate = jest.fn().mockResolvedValue(true);
const mockAssistantDelete = jest.fn().mockResolvedValue(true);
const mockAssistantCreate = jest.fn().mockResolvedValue({
  id: 'test-assistant-id',
  name: 'Test Assistant',
  model: 'gpt-4o',
  metadata: { version: '1.0' },
});
const mockAssistantList = jest.fn().mockResolvedValue({ data: [] });

describe('stop and close', () => {
  const mockRunsList = jest.fn().mockResolvedValue({
    data: [
      {
        status: 'in_progress',
        id: 'test-run-id',
      },
    ],
  });
  const mockRunsCancel = jest.fn().mockResolvedValue(true);

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset the singleton instance
    GPTAssistant['instance'] = null;

    // Reset openAIKey and openAIModel
    GPTAssistant['openAIKey'] = '';
    GPTAssistant['openAIModel'] = '';

    // mock openai methods
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
      () =>
        ({
          beta: {
            threads: {
              create: mockThreadCreate,
              retrieve: mockThreadRetrieve,
              del: mockThreadDelete,
              runs: {
                list: mockRunsList,
                cancel: mockRunsCancel,
              },
            },
            assistants: {
              create: mockAssistantCreate,
              list: mockAssistantList,
              update: mockAssistantUpdate,
              del: mockAssistantDelete,
            },
          },
        } as unknown as OpenAI)
    );
  });

  test('stop should stop the instance', async () => {
    GPTAssistant.configure({
      name: 'Test Assistant',
      apiKey: 'test-key',
      model: 'gpt-4o',
    });
    const instance = await GPTAssistant.getInstance();

    // await instance.stop();
    await expect(instance.stop()).rejects.toThrow('all runs are cancelled');

    // Wait for any pending promises to resolve
    await new Promise(process.nextTick);

    expect(mockRunsCancel).toHaveBeenCalledTimes(1);
    expect(mockRunsCancel).toHaveBeenCalledWith(
      'test-thread-id',
      'test-run-id'
    );

    // reset mock calls
    mockRunsCancel.mockClear();
  });

  test('close should close the instance', async () => {
    GPTAssistant.configure({
      apiKey: 'test-key',
      model: 'gpt-4o',
      name: 'Test Assistant',
    });
    const instance = await GPTAssistant.getInstance();

    await instance.close();

    // Wait for any pending promises to resolve
    await new Promise(process.nextTick);

    expect(mockThreadDelete).toHaveBeenCalledTimes(1);
    expect(mockThreadDelete).toHaveBeenCalledWith('test-thread-id');
    expect(mockAssistantDelete).toHaveBeenCalledTimes(1);
    expect(mockAssistantDelete).toHaveBeenCalledWith('test-assistant-id');
    expect(GPTAssistant['instance']).toBeNull();

    // restart the instance
    const instance2 = await GPTAssistant.getInstance();
    expect(instance2).not.toBe(instance);
  });
});

describe('instance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the singleton instance
    GPTAssistant['instance'] = null;

    // Reset openAIKey and openAIModel
    GPTAssistant['openAIKey'] = '';
    GPTAssistant['openAIModel'] = '';

    // mock openai methods
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
      () =>
        ({
          beta: {
            threads: {
              create: mockThreadCreate,
              retrieve: mockThreadRetrieve,
              del: mockThreadDelete,
            },
            assistants: {
              list: mockAssistantList,
              create: mockAssistantCreate,
              update: mockAssistantUpdate,
              del: mockAssistantDelete,
            },
          },
        } as unknown as OpenAI)
    );
  });

  test('should throw error if apiKey is not set', async () => {
    await expect(GPTAssistant.getInstance()).rejects.toThrow(
      'OpenAI API key is not set'
    );
  });

  test('getInstanceshould throw error if model is not set', async () => {
    GPTAssistant.configure({
      apiKey: 'test-key',
      model: '',
      name: 'Test Assistant',
    });
    await expect(GPTAssistant.getInstance()).rejects.toThrow(
      'OpenAI model is not set'
    );
  });

  test('configure should set static properties', () => {
    GPTAssistant.configure({
      apiKey: 'test-key',
      model: 'gpt-4o',
      name: 'Test Assistant',
      description: 'A test assistant',
      instructions: 'Test instructions',
      version: '1.0',
    });

    expect(GPTAssistant['openAIKey']).toBe('test-key');
    expect(GPTAssistant['openAIModel']).toBe('gpt-4o');
    expect(GPTAssistant['openAIAssistentBody']).toMatchObject({
      model: 'gpt-4o',
      name: 'Test Assistant',
      description: 'A test assistant',
      instructions: 'Test instructions',
      metadata: { version: '1.0' },
    });
  });

  test('getInstance should create and return a singleton instance', async () => {
    GPTAssistant.configure({
      apiKey: 'test-key',
      model: 'gpt-4o',
      name: 'Test Assistant',
      description: 'A test assistant',
      instructions: 'Test instructions',
      version: '1.0',
    });

    const instance1 = await GPTAssistant.getInstance();
    expect(mockThreadCreate).toHaveBeenCalledTimes(1);
    expect(mockAssistantList).toHaveBeenCalledTimes(1);
    expect(mockAssistantCreate).toHaveBeenCalledTimes(1);

    // update the mock that mockAssistantList will return a list with the assistant just created
    mockAssistantList.mockResolvedValue({
      data: [
        {
          id: 'test-assistant-id',
          name: 'Test Assistant',
          model: 'gpt-4o',
          metadata: { version: '1.0' },
        },
      ],
    });

    const instance2 = await GPTAssistant.getInstance();

    // instance1 and instance2 should be the same
    expect(instance1).toBe(instance2);
    // check if mockAssistantList is called again, so the assistant can be found from openai server
    expect(mockAssistantList).toHaveBeenCalledTimes(2);
    // no need to create assistant again
    expect(mockAssistantCreate).toHaveBeenCalledTimes(1);
    // no need to update assistant at all
    expect(mockAssistantUpdate).toHaveBeenCalledTimes(0);

    // reset the mocks
    mockAssistantList.mockResolvedValue({ data: [] });
  });

  test('getInstance should update assistant if the assistant version is changed', async () => {
    GPTAssistant.configure({
      apiKey: 'test-key',
      model: 'gpt-4o',
      name: 'Test Assistant',
      description: 'A test assistant',
      instructions: 'Test instructions',
      version: '1.0',
    });

    const instance1 = await GPTAssistant.getInstance();

    // update the mock that mockAssistantList will return a list with the assistant just created
    mockAssistantList.mockResolvedValue({
      data: [
        {
          id: 'test-assistant-id',
          name: 'Test Assistant',
          model: 'gpt-4o',
          metadata: { version: '1.0' },
        },
      ],
    });

    GPTAssistant.configure({
      apiKey: 'test-key',
      model: 'gpt-4o',
      name: 'Test Assistant',
      description: 'A test assistant',
      instructions: 'Test instructions',
      version: '2.0',
    });

    const instance2 = await GPTAssistant.getInstance();

    expect(mockThreadCreate).toHaveBeenCalledTimes(1);
    expect(mockAssistantList).toHaveBeenCalledTimes(2);
    expect(mockAssistantCreate).toHaveBeenCalledTimes(1);
    expect(mockAssistantUpdate).toHaveBeenCalledTimes(1);

    expect(instance1).toBe(instance2);

    // reset the mocks
    mockAssistantList.mockResolvedValue({ data: [] });
  });

  test('getInstance should create a new instance if the model is changed', async () => {
    GPTAssistant.configure({
      name: 'Test Assistant',
      apiKey: 'test-key',
      model: 'gpt-4o',
      version: '1.0',
    });
    const instance1 = await GPTAssistant.getInstance();

    // update the mock that mockAssistantList will return a list with the assistant just created
    mockAssistantList.mockResolvedValue({
      data: [
        {
          id: 'test-assistant-id',
          name: 'Test Assistant',
          model: 'gpt-4o',
          metadata: { version: '1.0' },
        },
      ],
    });

    GPTAssistant.configure({
      name: 'Test Assistant',
      apiKey: 'test-key',
      model: 'gpt-4o-mini',
      version: '1.0',
    });
    const instance2 = await GPTAssistant.getInstance();

    // for openai assistant, instance1 and instance2 should be the same, and only configurations are different
    expect(instance1).toBe(instance2);
    expect(mockThreadCreate).toHaveBeenCalledTimes(1);
    expect(mockAssistantList).toHaveBeenCalledTimes(2);
    expect(mockAssistantCreate).toHaveBeenCalledTimes(1);
    expect(mockAssistantUpdate).toHaveBeenCalledTimes(1);

    expect(GPTAssistant['openAIKey']).toBe('test-key');
    expect(GPTAssistant['openAIModel']).toBe('gpt-4o-mini');
    expect(GPTAssistant['openAIAssistentBody'].model).toBe('gpt-4o-mini');
  });
});

describe('prompts', () => {
  const mockAudioTranslate = jest.fn();
  const mockChatCompletionStream = jest.fn();
  const mockMessageCreate = jest.fn();
  const mockRunsStream = jest.fn();
  const mockRunsCreateAndPoll = jest.fn();
  const mockSubmitToolOutputsStream = jest.fn();
  const mockMessageList = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();

    // reset singleton instance
    GPTAssistant['instance'] = null;

    // configure the assistant
    GPTAssistant.configure({
      apiKey: 'test-key',
      model: 'gpt-4o',
      name: 'Test',
    });

    // mock openai methods
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
      () =>
        ({
          beta: {
            threads: {
              create: mockThreadCreate,
              retrieve: mockThreadRetrieve,
              del: mockThreadDelete,
              messages: {
                create: mockMessageCreate,
                list: mockMessageList,
              },
              runs: {
                stream: mockRunsStream,
                submitToolOutputsStream: mockSubmitToolOutputsStream,
                createAndPoll: mockRunsCreateAndPoll,
              },
            },
            assistants: {
              list: mockAssistantList,
              create: mockAssistantCreate,
              update: mockAssistantUpdate,
              del: mockAssistantDelete,
            },
            chat: {
              completions: {
                stream: mockChatCompletionStream,
              },
            },
          },
          audio: { translations: { create: mockAudioTranslate } },
        } as unknown as OpenAI)
    );
  });

  test('additional context should be added', async () => {
    const mockCallback = jest.fn();

    // mock assistantCreate
    mockAssistantCreate.mockResolvedValue({
      id: 'test-assistant-id',
      metadata: {},
    });

    // mock the createAndPoll method
    mockRunsCreateAndPoll.mockResolvedValue({
      status: 'completed',
      thread_id: 'test-thread-id',
    });

    // mock the message list method
    mockMessageList.mockResolvedValue({
      data: [
        {
          role: 'assistant',
          content: 'test context reponse',
        },
      ],
    });

    const instance = await GPTAssistant.getInstance();
    await instance.addAdditionalContext({
      context: 'test context',
      callback: mockCallback,
    });

    expect(mockRunsCreateAndPoll).toHaveBeenCalledTimes(1);
    expect(mockRunsCreateAndPoll).toHaveBeenCalledWith('test-thread-id', {
      assistant_id: 'test-assistant-id',
    });
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('audioToText should call OpenAI audio translations', async () => {
    mockAudioTranslate.mockResolvedValue({ text: 'Translated text' });
    const instance = await GPTAssistant.getInstance();

    const audioBlob = new Blob(['audio data'], { type: 'audio/webm' });
    const result = await instance.audioToText({ audioBlob });

    expect(result).toBe('Translated text');
    expect(mockAudioTranslate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'whisper-1',
        file: expect.any(File),
      })
    );
    expect(mockMutexRelease).toHaveBeenCalledTimes(1);
  });

  test('audioToText should return empty string if audioBlob is null', async () => {
    const instance = await GPTAssistant.getInstance();
    const result = await instance.audioToText({ audioBlob: undefined });
    expect(result).toBe('');
  });

  test('processImageMessage should call OpenAI image message', async () => {
    // mock streamMessageCallback
    const mockStreamMessageCallback = jest.fn();

    // mock stream
    const mockStream = {
      on: jest.fn((event, callback) => {
        if (event === 'chunk') {
          callback({ choices: [{ delta: { content: 'test' } }] });
        } else if (event === 'finalChatCompletion') {
          callback({ choices: [{ message: { content: 'test' } }] });
        } else if (event === 'end') {
          callback();
        }
        return mockStream;
      }),
    };

    // mock mockChatCompletionStream
    mockChatCompletionStream.mockResolvedValue(mockStream);

    const instance = await GPTAssistant.getInstance();
    await instance.processImageMessage({
      imageMessage: 'test',
      textMessage: 'test',
      streamMessageCallback: mockStreamMessageCallback,
    });

    expect(mockStreamMessageCallback).toHaveBeenCalledTimes(2);
    expect(mockStreamMessageCallback).toHaveBeenNthCalledWith(1, {
      deltaMessage: 'test',
    });
    expect(mockStreamMessageCallback).toHaveBeenNthCalledWith(2, {
      deltaMessage: 'test',
      isCompleted: true,
    });
    expect(mockMutexRelease).toHaveBeenCalledTimes(1);
  });

  describe('processTextMessage', () => {
    const mockStreamMessageCallback = jest.fn();
    const mockFinalRun = jest.fn();

    test('should return warning if openai is not available', async () => {
      const instance = await GPTAssistant.getInstance();

      // @ts-expect-error mock the openai instance to be null
      instance['openai'] = null;

      await instance.processTextMessage({
        textMessage: 'test',
        streamMessageCallback: mockStreamMessageCallback,
      });

      expect(mockStreamMessageCallback).toHaveBeenCalledTimes(1);
      expect(mockStreamMessageCallback).toHaveBeenNthCalledWith(1, {
        deltaMessage:
          'Sorry, the connection is not established. Please try again later.',
        isCompleted: true,
      });
    });

    test('should call OpenAI chat completions', async () => {
      const mockStream = {
        *[Symbol.iterator]() {
          yield {
            event: 'thread.message.delta',
            data: {
              delta: {
                content: [{ text: { value: 'thanks ' }, type: 'text' }],
              },
            },
            id: 'test-run-id',
            thread_id: 'test-thread-id',
          };
          yield {
            event: 'thread.message.delta',
            data: {
              delta: {
                content: [{ text: { value: 'for testing.' }, type: 'text' }],
              },
            },
            id: 'test-run-id',
            thread_id: 'test-thread-id',
          };
        },
        finalRun: mockFinalRun,
      };
      mockRunsStream.mockResolvedValue(mockStream);

      const instance = await GPTAssistant.getInstance();
      await instance.processTextMessage({
        textMessage: 'test',
        streamMessageCallback: mockStreamMessageCallback,
      });

      expect(mockRunsStream).toHaveBeenCalledTimes(1);
      expect(mockFinalRun).toHaveBeenCalledTimes(1);
      expect(mockStreamMessageCallback).toHaveBeenCalledTimes(3);
      expect(mockStreamMessageCallback).toHaveBeenNthCalledWith(1, {
        deltaMessage: 'thanks ',
      });
      expect(mockStreamMessageCallback).toHaveBeenNthCalledWith(2, {
        deltaMessage: 'thanks for testing.',
      });
      expect(mockStreamMessageCallback).toHaveBeenNthCalledWith(3, {
        customMessage: null,
        deltaMessage: 'thanks for testing.',
        isCompleted: true,
      });
      expect(mockMutexRelease).toHaveBeenCalledTimes(1);
    });

    test('should handle thread.run.failed', async () => {
      const mockStream = {
        *[Symbol.iterator]() {
          yield {
            event: 'thread.run.failed',
            data: 'thread run failed',
            id: 'test-run-id',
            thread_id: 'test-thread-id',
          };
        },
        finalRun: mockFinalRun,
      };
      mockRunsStream.mockResolvedValue(mockStream);

      const instance = await GPTAssistant.getInstance();
      await instance.processTextMessage({
        textMessage: 'test',
        streamMessageCallback: mockStreamMessageCallback,
      });

      expect(mockStreamMessageCallback).toHaveBeenCalledTimes(1);
      expect(mockStreamMessageCallback).toHaveBeenNthCalledWith(1, {
        deltaMessage:
          'Sorry, something went wrong. Please try again later. Error: thread run failed',
        isCompleted: true,
      });
      // finalRun should not be called
      expect(mockFinalRun).toHaveBeenCalledTimes(0);
      expect(mockMutexRelease).toHaveBeenCalledTimes(1);
    });

    describe('tool call', () => {
      const mockStreamWithToolCallFinalRun = jest.fn();

      const mockStreamWithToolCall = {
        finalRun: mockStreamWithToolCallFinalRun,
        *[Symbol.iterator]() {
          yield {
            event: 'thread.message.delta',
            data: {
              delta: {
                content: [
                  {
                    text: {
                      value: 'Sure, here is the temperature in Chicago: ',
                    },
                    type: 'text',
                  },
                ],
              },
            },
          };
          yield {
            event: 'thread.run.requires_action',
            data: {
              id: 'test-run-id',
              thread_id: 'test-thread-id',
              required_action: {
                submit_tool_outputs: {
                  tool_calls: [
                    {
                      function: {
                        name: 'getTemperature',
                        arguments: '{"city": "chicago"}',
                      },
                      id: 'test-tool-call-id',
                    },
                  ],
                },
              },
            },
          };
        },
      };

      const mockGetTemperature = jest.fn();
      const mockCallbackMessage = jest.fn();
      const mockToolOutputFinalRun = jest.fn();

      const mockToolOutputStream = {
        on: jest.fn((event, callback) => {
          if (event === 'textDelta') {
            callback({ value: 'The temperature in Chicago is 80 degrees.' });
          }
          return mockToolOutputStream;
        }),
        finalRun: mockToolOutputFinalRun,
      };

      beforeEach(() => {
        // reset the mockGetTemperature
        mockGetTemperature.mockClear();

        // mock the stream with tool call
        mockRunsStream.mockResolvedValue(mockStreamWithToolCall);

        // mock the submitToolOutputsStream results
        mockSubmitToolOutputsStream.mockReturnValue(mockToolOutputStream);

        // mock the submitToolOutputStream is the final run, no more tool calls needed
        mockToolOutputFinalRun.mockResolvedValue({
          status: 'completed',
        });

        // mock the callback message
        mockCallbackMessage.mockReturnValue('custom message');

        // configure custom functions
        GPTAssistant.registerFunctionCalling({
          name: 'getTemperature',
          description: 'Get the temperature',
          properties: {
            city: {
              type: 'string',
              description: 'The city to get the temperature',
            },
          },
          callbackFunction: mockGetTemperature,
          callbackFunctionContext: { context: 'test_context' },
          callbackMessage: mockCallbackMessage,
          required: ['city'],
        });
      });

      test('tool call should be handled with success callback', async () => {
        // mock the callback function results
        mockGetTemperature.mockReturnValue({ result: '80' });

        const instance = await GPTAssistant.getInstance();
        await instance.processTextMessage({
          textMessage: 'what is the temperature in chicago?',
          streamMessageCallback: mockStreamMessageCallback,
        });

        // Wait for any pending promises to resolve
        await new Promise(process.nextTick);

        // check if the callback function is called
        expect(mockGetTemperature).toHaveBeenCalledTimes(1);
        expect(mockGetTemperature).toHaveBeenCalledWith({
          functionName: 'getTemperature',
          functionArgs: { city: 'chicago' },
          functionContext: { context: 'test_context' },
        });

        // check if the submitToolOutputsStream is called to return results back to LLM
        expect(mockSubmitToolOutputsStream).toHaveBeenCalledTimes(1);
        expect(mockToolOutputFinalRun).toHaveBeenCalledTimes(1);

        // check if the LLM is streaming the results back
        expect(mockStreamMessageCallback).toHaveBeenCalledTimes(3);
        expect(mockStreamMessageCallback).toHaveBeenNthCalledWith(1, {
          deltaMessage: 'Sure, here is the temperature in Chicago: ',
        });
        expect(mockStreamMessageCallback).toHaveBeenNthCalledWith(2, {
          deltaMessage:
            'Sure, here is the temperature in Chicago: \n\nThe temperature in Chicago is 80 degrees.',
        });
        expect(mockStreamMessageCallback).toHaveBeenNthCalledWith(3, {
          deltaMessage:
            'Sure, here is the temperature in Chicago: \n\nThe temperature in Chicago is 80 degrees.\n\n',
          customMessage: 'custom message',
          isCompleted: true,
        });

        // check if the callback message is called
        expect(mockCallbackMessage).toHaveBeenCalledTimes(1);
        expect(mockCallbackMessage).toHaveBeenNthCalledWith(1, {
          functionName: 'getTemperature',
          functionArgs: { city: 'chicago' },
          output: expect.objectContaining({
            result: '80',
            name: 'getTemperature',
            args: { city: 'chicago' },
          }),
        });
      });

      test('tool call should be handled with failed callback', async () => {
        // mock the callback function raise error
        mockGetTemperature.mockImplementation(() => {
          throw new Error('test error');
        });

        // mock the submitToolOutputsStream results
        mockSubmitToolOutputsStream.mockReturnValue({
          on: jest.fn((event, callback) => {
            if (event === 'textDelta') {
              callback({ value: 'Sorry, the temperature is not available.' });
            }
            return mockToolOutputStream;
          }),
          finalRun: mockToolOutputFinalRun,
        });

        const instance = await GPTAssistant.getInstance();
        await instance.processTextMessage({
          textMessage: 'what is the temperature in chicago?',
          streamMessageCallback: mockStreamMessageCallback,
        });

        // Wait for any pending promises to resolve
        await new Promise(process.nextTick);

        // check if the callback function is called
        expect(mockGetTemperature).toHaveBeenCalledTimes(1);
        expect(mockGetTemperature).toHaveBeenCalledWith({
          functionName: 'getTemperature',
          functionArgs: { city: 'chicago' },
          functionContext: { context: 'test_context' },
        });

        // check if the submitToolOutputsStream is called to return results back to LLM
        expect(mockSubmitToolOutputsStream).toHaveBeenCalledTimes(1);
        expect(mockSubmitToolOutputsStream).toHaveBeenCalledWith(
          'test-thread-id',
          'test-run-id',
          {
            tool_outputs: [
              {
                tool_call_id: 'test-tool-call-id',
                output: JSON.stringify({
                  success: false,
                  details:
                    'The function "getTemperature" is not executed. The error message is: Error: test error',
                }),
              },
            ],
          }
        );
        expect(mockToolOutputFinalRun).toHaveBeenCalledTimes(1);

        // check if the LLM is streaming the results back
        expect(mockStreamMessageCallback).toHaveBeenCalledTimes(3);
        expect(mockStreamMessageCallback).toHaveBeenNthCalledWith(1, {
          deltaMessage: 'Sure, here is the temperature in Chicago: ',
        });
        expect(mockStreamMessageCallback).toHaveBeenNthCalledWith(2, {
          deltaMessage:
            'Sure, here is the temperature in Chicago: \n\nSorry, the temperature is not available.',
        });
        expect(mockStreamMessageCallback).toHaveBeenNthCalledWith(3, {
          deltaMessage:
            'Sure, here is the temperature in Chicago: \n\nSorry, the temperature is not available.',
          customMessage: null,
          isCompleted: true,
        });
      });

      test('two tool calls should be handled', async () => {});
    });
  });
});
