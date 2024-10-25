import {
  AudioToTextProps,
  CustomFunctionOutputProps,
  CustomFunctions,
  ProcessImageMessageProps,
  ProcessMessageProps,
  RegisterFunctionCallingProps,
  StreamMessageCallback,
} from '../types';

import OpenAI from 'openai';
import { Mutex } from 'async-mutex';
import { AbstractAssistant } from './assistant';
import { ReactNode } from 'react';

export class GPTAssistant extends AbstractAssistant {
  private openai: OpenAI;

  private thread: OpenAI.Beta.Threads.Thread | null = null;

  private assistant: OpenAI.Beta.Assistants.Assistant | null = null;

  private cachedAssistantList: OpenAI.Beta.Assistants.AssistantsPage | null =
    null;

  private mutex = new Mutex();

  private lastMessage: string = '';

  private customMessage: ReactNode | null = null;

  private static openAIKey = '';

  private static openAIModel = 'gpt-4o-mini';

  private static openAIAssistentBody: OpenAI.Beta.Assistants.AssistantCreateParams;

  private static customFunctions: CustomFunctions = {};

  private static instance: GPTAssistant | null = null;

  private constructor() {
    super();
    // Initialize OpenAI instance
    this.openai = new OpenAI({
      apiKey: GPTAssistant.openAIKey,
      dangerouslyAllowBrowser: true,
    });
  }

  private async findAssistant() {
    if (!this.cachedAssistantList) {
      this.cachedAssistantList = await this.openai.beta.assistants.list();
    }

    // find assistant from openai server
    this.assistant =
      this.cachedAssistantList.data.find(
        (assistant) => assistant.name === GPTAssistant.openAIAssistentBody?.name
      ) ?? null;

    // create assistant if not found using the openAIAssistentBody
    if (!this.assistant) {
      this.assistant = await this.openai.beta.assistants.create(
        GPTAssistant.openAIAssistentBody
      );
      // reset cached assistant list, so next time it will be fetched from openai server
      this.cachedAssistantList = null;
    }

    return this.assistant;
  }

  private async createThread() {
    this.thread = await this.openai.beta.threads.create();
  }

  /**
   * Check if the assistant is not latest using version in metadata
   * @param assistant
   * @returns
   */
  private static needUpdateAssistant(
    assistant: OpenAI.Beta.Assistants.Assistant
  ) {
    const versionExisted =
      assistant.metadata &&
      typeof assistant.metadata === 'object' &&
      'version' in assistant.metadata &&
      GPTAssistant.openAIAssistentBody.metadata &&
      typeof GPTAssistant.openAIAssistentBody.metadata === 'object' &&
      'version' in GPTAssistant.openAIAssistentBody.metadata &&
      GPTAssistant.openAIAssistentBody.metadata.version !== '';

    const modelChanged =
      assistant.model !== undefined &&
      GPTAssistant.openAIModel !== undefined &&
      assistant.model !== GPTAssistant.openAIModel;

    const temperatureChanged =
      GPTAssistant.openAIAssistentBody.temperature !== undefined &&
      assistant.temperature !== undefined &&
      assistant.temperature !== GPTAssistant.openAIAssistentBody.temperature;

    const top_pChanged =
      GPTAssistant.openAIAssistentBody.top_p !== undefined &&
      assistant.top_p !== undefined &&
      assistant.top_p !== GPTAssistant.openAIAssistentBody.top_p;

    const versionChanged =
      versionExisted &&
      assistant.metadata &&
      typeof assistant.metadata === 'object' &&
      'version' in assistant.metadata &&
      GPTAssistant.openAIAssistentBody.metadata &&
      typeof GPTAssistant.openAIAssistentBody.metadata === 'object' &&
      'version' in GPTAssistant.openAIAssistentBody.metadata &&
      GPTAssistant.openAIAssistentBody.metadata?.version !==
        assistant.metadata?.version;

    return versionChanged || modelChanged || temperatureChanged || top_pChanged;
  }

  private static checkOpenAIKey() {
    if (!GPTAssistant.openAIKey || GPTAssistant.openAIKey === '') {
      throw new Error('OpenAI API key is not set');
    }
  }

  private static checkOpenAIModel() {
    if (!GPTAssistant.openAIModel || GPTAssistant.openAIModel === '') {
      throw new Error('OpenAI model is not set');
    }
  }

  private static checkOpenAIAssistantName() {
    if (
      !GPTAssistant.openAIAssistentBody ||
      !GPTAssistant.openAIAssistentBody.name ||
      GPTAssistant.openAIAssistentBody.name === ''
    ) {
      throw new Error('OpenAI assistant name is not set');
    }
  }

  public static async getInstance(): Promise<GPTAssistant> {
    // check configure
    GPTAssistant.checkOpenAIKey();
    GPTAssistant.checkOpenAIModel();
    GPTAssistant.checkOpenAIAssistantName();
    if (!GPTAssistant.instance) {
      // create singleton instance
      GPTAssistant.instance = new GPTAssistant();
    }

    if (!GPTAssistant.instance.thread) {
      // create thread
      await GPTAssistant.instance.createThread();
    }

    // find assistant from openai or create a new one if not found
    const assistant = await GPTAssistant.instance.findAssistant();

    if (assistant && GPTAssistant.needUpdateAssistant(assistant)) {
      // update assistant if needed based on the version in metadata
      GPTAssistant.instance.assistant =
        await GPTAssistant.instance.openai.beta.assistants.update(
          assistant.id,
          GPTAssistant.openAIAssistentBody
        );
      // reset cached assistant list, so next time it will be fetched from openai server
      GPTAssistant.instance.cachedAssistantList = null;
    }

    return GPTAssistant.instance;
  }

  public override async stop() {
    try {
      if (this.thread) {
        const threadId = this.thread.id;
        const threadExists = await this.openai.beta.threads.retrieve(threadId);
        if (threadExists) {
          const runs = await this.openai.beta.threads.runs.list(threadId);
          runs.data.forEach(async (run) => {
            if (
              run.status === 'in_progress' ||
              run.status === 'requires_action'
            ) {
              await this.openai.beta.threads.runs.cancel(threadId, run.id);
            }
          });
        }
      }
    } catch (e) {
      console.error('stop() error: ', e);
      throw new Error('stop() error: ' + e);
    }
  }

  public override async close() {
    if (this.thread) {
      await this.stop();
      await this.openai.beta.threads.del(this.thread.id);
      if (this.assistant) {
        await this.openai.beta.assistants.del(this.assistant.id);
      }
    }
    this.thread = null;
    // need to reset the instance so getInstance doesn't return the same instance
    GPTAssistant.instance = null;
  }

  public static override configure({
    model,
    apiKey,
    instructions,
    name,
    description,
    version,
    temperature,
    top_p,
  }: {
    name: string;
    model: string;
    apiKey: string;
    version?: string;
    instructions?: string;
    description?: string;
    temperature?: number;
    top_p?: number;
  }) {
    GPTAssistant.openAIKey = apiKey || '';
    GPTAssistant.openAIModel = model || '';

    GPTAssistant.openAIAssistentBody = {
      model: model || '',
      name: name || '',
      description: description || '',
      instructions: instructions || '',
      metadata: {
        version: version || '',
      },
      temperature: temperature || 1.0,
      top_p: top_p || 0.8,
      tools: [],
    };
  }

  public static override registerFunctionCalling({
    name,
    description,
    properties,
    required,
    callbackFunction,
    callbackFunctionContext,
    callbackMessage,
  }: RegisterFunctionCallingProps) {
    if (!GPTAssistant.openAIAssistentBody) {
      throw new Error(
        'Please call OpenAIHelper.registerFunctionCalling() after OpenAIHelper.configure() and before OpenAIHelper.getInstance().'
      );
    }

    // register custom function
    GPTAssistant.customFunctions[name] = {
      func: callbackFunction,
      context: callbackFunctionContext,
      callbackMessage,
    };

    // add function calling to assistant body
    if (!GPTAssistant.openAIAssistentBody.tools) {
      GPTAssistant.openAIAssistentBody.tools = [];
    }
    GPTAssistant.openAIAssistentBody.tools.push({
      type: 'function',
      function: {
        name,
        description,
        parameters: {
          type: 'object',
          properties,
          required,
        },
      },
    });
  }

  public override async audioToText({
    audioBlob,
  }: AudioToTextProps): Promise<string> {
    if (!audioBlob) return '';

    // create FsReadStream from the audioBlob
    const file = new File([audioBlob], 'audio.webm');

    let response = '';
    const release = await this.mutex.acquire();
    try {
      // create a translation from audio to text
      const translation = await this.openai.audio.translations.create({
        model: 'whisper-1',
        file: file,
      });
      response = translation.text;
    } finally {
      // release the lock
      release();
    }

    return response;
  }

  /**
   * Add additional context to the conversation using OpenAI Assistants
   * Since OpenAI will maintain the context in a thread, so we can add additional context to the conversation
   * as a user message, and don't expect a response from the assistant.
   *
   * @param context String to be added to the conversation context
   */
  public override async addAdditionalContext({
    context,
    callback,
  }: {
    context: string;
    callback?: () => void;
  }) {
    if (!this.openai || !this.thread || !this.assistant) {
      throw new Error('OpenAI is not initialized.');
    }
    const release = await this.mutex.acquire();
    try {
      await this.openai.beta.threads.messages.create(this.thread.id, {
        role: 'user',
        content: context + '\n Please do not respond to this message.',
      });

      const run = await this.openai.beta.threads.runs.createAndPoll(
        this.thread.id,
        {
          assistant_id: this.assistant.id,
        }
      );

      if (run.status === 'completed') {
        const messages = await this.openai.beta.threads.messages.list(
          run.thread_id
        );
        for (const message of messages.data.reverse()) {
          console.log(`${message.role} > ${message.content[0]}`);
        }
        if (callback) callback();
      } else {
        console.log(run.status);
        // cancel run if it's not completed
        await this.openai.beta.threads.runs.cancel(run.thread_id, run.id);
      }
    } finally {
      release();
    }
  }

  public override async processImageMessage({
    imageMessage,
    textMessage,
    streamMessageCallback,
  }: ProcessImageMessageProps) {
    const release = await this.mutex.acquire();
    // create image message content
    const imageMessageContent: OpenAI.Beta.Threads.ImageURLContentBlock = {
      type: 'image_url',
      image_url: {
        url: imageMessage || '',
        detail: 'high',
      },
    };
    // reset last message
    this.lastMessage = '';
    // request chat completion
    const stream = await this.openai.beta.chat.completions.stream({
      model: GPTAssistant.openAIModel,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: textMessage,
            },
            imageMessageContent,
          ],
        },
      ],
    });

    stream
      .on('chunk', (chunk) => {
        const delta = chunk.choices[0]?.delta?.content || '';
        this.lastMessage += delta;
        streamMessageCallback({ deltaMessage: this.lastMessage });
      })
      .on('finalChatCompletion', (completion) => {
        streamMessageCallback({
          deltaMessage: completion.choices[0]?.message.content || '',
          isCompleted: true,
        });
      })
      .on('end', async () => {
        release();
      })
      .on('error', async (err) => {
        console.error(err);
        release();
      })
      .on('abort', async () => {
        release();
      });
  }

  public override async processTextMessage({
    textMessage,
    streamMessageCallback,
  }: ProcessMessageProps) {
    if (!this.openai || !this.thread || !this.assistant) {
      streamMessageCallback({
        deltaMessage:
          'Sorry, the connection is not established. Please try again later.',
        isCompleted: true,
      });
      return;
    }

    const release = await this.mutex.acquire();

    // reset previous message and custom message
    this.lastMessage = '';
    this.customMessage = null;

    try {
      // create message content
      await this.openai.beta.threads.messages.create(this.thread.id, {
        role: 'user',
        content: textMessage,
      });

      // create a run with stream to handle the assistant response
      const run = await this.openai.beta.threads.runs.stream(this.thread.id, {
        assistant_id: this.assistant.id,
        parallel_tool_calls: true,
      });

      let nextRun;

      // process the run events
      for await (const event of run) {
        // Retrieve events that are denoted with 'requires_action'
        // since these will have our tool_calls
        if (event.event === 'thread.run.requires_action') {
          nextRun = await this.handleRequiresAction(
            event.data,
            event.data.id,
            event.data.thread_id,
            streamMessageCallback
          );
        } else if (event.event === 'thread.message.delta') {
          const content = event.data.delta.content;
          const textContent = content
            ?.filter((c) => c.type === 'text')
            .reduce((acc, c) => {
              return acc + c.text?.value || '';
            }, '');

          this.lastMessage += textContent || '';
          // stream the message back to the UI
          streamMessageCallback({ deltaMessage: this.lastMessage });
        } else if (event.event === 'thread.run.failed') {
          streamMessageCallback({
            deltaMessage: 'Sorry, run failed.',
            isCompleted: true,
          });
          throw new Error(`${event.data}`);
        }
      }

      // if there is more than one function call in the same run, process them
      const previousFunctionName: string | null =
        nextRun?.run?.required_action?.submit_tool_outputs.tool_calls?.[0]
          ?.function?.name || null;

      while (nextRun && nextRun.run?.status === 'requires_action') {
        nextRun = await this.handleRequiresAction(
          nextRun.run,
          nextRun.run.id,
          nextRun.run.thread_id,
          streamMessageCallback,
          nextRun.output
        );
        const nextFunctionName =
          nextRun?.run?.required_action?.submit_tool_outputs.tool_calls?.[0]
            ?.function?.name || null;

        if (previousFunctionName === nextFunctionName) {
          // this will become an infinite loop if the function name is the same
          await run.abort();
          break;
        }
      }

      // wait for final run
      await run.finalRun();
      streamMessageCallback({
        deltaMessage: this.lastMessage,
        customMessage: this.customMessage,
        isCompleted: true,
      });

      // reset custom message
      this.customMessage = null;
    } catch (e) {
      console.error('processTextMessage() error: ', e);
    } finally {
      release();
    }
  }

  private async handleRequiresAction(
    data: OpenAI.Beta.Threads.Run,
    runId: string,
    threadId: string,
    streamMessageCallback: StreamMessageCallback,
    previousOutput?: CustomFunctionOutputProps<unknown, unknown>[]
  ): Promise<{
    run: OpenAI.Beta.Threads.Run | null;
    output: CustomFunctionOutputProps<unknown, unknown>[];
  } | null> {
    const toolCalls = data.required_action?.submit_tool_outputs.tool_calls;

    if (!toolCalls) return null;

    const functionOutput: CustomFunctionOutputProps<unknown, unknown>[] = [];

    for (let i = 0; i < toolCalls?.length || 0; i++) {
      const toolCall = toolCalls[i];
      const functionName = toolCall.function.name;
      const functionArgs = JSON.parse(toolCall.function.arguments);
      try {
        const { func, context, callbackMessage } =
          GPTAssistant.customFunctions[functionName];
        const output = await func({
          functionName,
          functionArgs,
          functionContext: context,
          previousOutput,
        });
        functionOutput.push({
          ...output,
          name: functionName,
          args: functionArgs,
          customMessageCallback: callbackMessage,
        });
      } catch (err) {
        // make sure to return something back to openai when the function execution fails
        functionOutput.push({
          type: 'errorOutput',
          name: functionName,
          args: functionArgs,
          result: {
            success: false,
            details: `The function "${functionName}" is not executed. The error message is: ${err}`,
          },
        });
      }
    }
    // Submit all the tool outputs at the same time
    const nextRun = await this.submitAllToolOutputs(
      runId,
      toolCalls[0].id,
      threadId,
      functionOutput,
      streamMessageCallback
    );

    return { run: nextRun, output: functionOutput };
  }

  private async submitAllToolOutputs(
    runId: string,
    toolCallId: string,
    threadId: string,
    functionOutput: Array<CustomFunctionOutputProps<unknown, unknown>>,
    streamMessageCallback: StreamMessageCallback
  ) {
    // add a space between messages if needed
    if (this.lastMessage.length > 0) {
      this.lastMessage += '\n\n';
    }

    const toolOutputs = functionOutput.map((output) => ({
      tool_call_id: toolCallId,
      output: JSON.stringify(output.result),
    }));

    // Use the submitToolOutputsStream helper
    const stream = this.openai.beta.threads.runs
      .submitToolOutputsStream(threadId, runId, {
        tool_outputs: toolOutputs,
      })
      .on('textDelta', (textDelta) => {
        // streaming what LLM responses and add a custom response UI if needed
        this.lastMessage = this.lastMessage + textDelta.value || '';
        streamMessageCallback({ deltaMessage: this.lastMessage });
      });

    const finalRun = await stream?.finalRun();

    // if finalRun still requires actions (function calls), we need to process them
    const isIntermediate = finalRun && finalRun.status === 'requires_action';

    // add custom response message e.g. in the UI if needed
    if (!isIntermediate) {
      functionOutput.forEach((output) => {
        const customResponseMsg = output.customMessageCallback?.({
          functionName: output.name,
          functionArgs: output.args || {},
          output,
        });
        // append a custom response e.g. plot, map etc. if needed
        if (customResponseMsg) {
          if (this.lastMessage.length > 0) {
            this.lastMessage += '\n\n';
          }
          this.customMessage = customResponseMsg;
        }
      });
    }

    return finalRun;
  }
}
