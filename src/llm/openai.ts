import {
  CustomFunctionOutputProps,
  CustomFunctions,
  CustomMessageCallback,
  MessageModel,
  OpenAIConfigProps,
  ProcessImageMessageProps,
  ProcessMessageProps,
  RegisterFunctionCallingProps,
  StreamMessageCallback,
  UserActionProps,
} from '../types';

import OpenAI from 'openai';
import { Mutex } from 'async-mutex';
import { AbstractLLM } from './interface';

export class OpenAIHelper extends AbstractLLM {
  private openai: OpenAI;

  private thread: OpenAI.Beta.Threads.Thread | null = null;

  private assistant: OpenAI.Beta.Assistants.Assistant | undefined = undefined;

  private mutex = new Mutex();

  private lastMessage: string = '';

  private static openAIKey = '';

  private static openAIModel = 'gpt-4o-mini';

  private static openAIAssistentBody: OpenAI.Beta.Assistants.AssistantCreateParams;

  private static customFunctions: CustomFunctions = {};

  private static instance: OpenAIHelper | null = null;

  private constructor() {
    super();
    // Initialize OpenAI instance
    this.openai = new OpenAI({
      apiKey: OpenAIHelper.openAIKey,
      dangerouslyAllowBrowser: true,
    });
  }

  private async findAssistant() {
    const assistants = await this.openai.beta.assistants.list();
    return (this.assistant = assistants.data.find(
      (assistant) => assistant.name === OpenAIHelper.openAIAssistentBody?.name
    ));
  }

  private async createThread() {
    this.thread = await this.openai.beta.threads.create();
  }

  private static needUpdateAssistant(
    assistant: OpenAI.Beta.Assistants.Assistant
  ) {
    const versionExisted =
      assistant.metadata &&
      typeof assistant.metadata === 'object' &&
      'version' in assistant.metadata;

    const versionChanged =
      assistant.metadata &&
      typeof assistant.metadata === 'object' &&
      'version' in assistant.metadata &&
      OpenAIHelper.openAIAssistentBody.metadata &&
      typeof OpenAIHelper.openAIAssistentBody.metadata === 'object' &&
      'version' in OpenAIHelper.openAIAssistentBody.metadata &&
      OpenAIHelper.openAIAssistentBody.metadata?.version !==
        assistant.metadata?.version;

    return !versionExisted || versionChanged;
  }
  public static async getInstance(): Promise<OpenAIHelper> {
    // check if openAIkey is set
    if (
      !OpenAIHelper.openAIKey ||
      !OpenAIHelper.openAIModel ||
      !OpenAIHelper.openAIAssistentBody
    ) {
      throw new Error(
        'OpenAI is not configured. Please call OpenAIHelper.configure() first.'
      );
    }
    if (!OpenAIHelper.instance) {
      // create singleton instance
      OpenAIHelper.instance = new OpenAIHelper();

      // create thread
      await OpenAIHelper.instance.createThread();

      // find assistant
      const assistant = await OpenAIHelper.instance.findAssistant();

      // create or update GeoDa.Ai assistant if needed
      if (!assistant) {
        OpenAIHelper.instance.assistant =
          await OpenAIHelper.instance.openai.beta.assistants.create(
            OpenAIHelper.openAIAssistentBody
          );
      } else {
        // check if assistant is latest
        const assistantId = assistant.id;
        if (OpenAIHelper.needUpdateAssistant(assistant)) {
          OpenAIHelper.instance.assistant =
            await OpenAIHelper.instance.openai.beta.assistants.update(
              assistantId,
              OpenAIHelper.openAIAssistentBody
            );
        }
      }
    }
    return OpenAIHelper.instance;
  }

  private async cancelRun() {
    const release = await this.mutex.acquire();
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
      console.error('cancelRun() error: ', e);
    } finally {
      release();
    }
  }

  public static override configure({
    apiKey,
    model,
    temperature,
    top_p,
    name,
    description,
    instructions,
    version,
  }: OpenAIConfigProps) {
    OpenAIHelper.openAIKey = apiKey;
    OpenAIHelper.openAIModel = model;

    OpenAIHelper.openAIAssistentBody = {
      model: model,
      name: name,
      description: description,
      instructions: instructions,
      metadata: {
        version: version,
      },
      temperature: temperature || 0.8,
      top_p: top_p || 0.8,
      tools: [],
    };
  }

  public static override async registerFunctionCalling({
    name,
    description,
    properties,
    required,
    callbackFunction,
    callbackFunctionContext,
    callbackMessage,
  }: RegisterFunctionCallingProps) {
    if (this.instance || !OpenAIHelper.openAIAssistentBody) {
      throw new Error(
        'Custom function should be registered before getting the instance. Please call OpenAIHelper.registerFunctionCalling() after OpenAIHelper.configure() and before OpenAIHelper.getInstance().'
      );
    }

    // register custom function
    OpenAIHelper.customFunctions[name] = {
      func: callbackFunction,
      context: callbackFunctionContext,
      callbackMessage,
    };

    // add function calling to assistant body
    if (!OpenAIHelper.openAIAssistentBody.tools) {
      OpenAIHelper.openAIAssistentBody.tools = [];
    }
    OpenAIHelper.openAIAssistentBody.tools.push({
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

  public override async close() {
    if (this.thread) {
      await this.cancelRun();
      await this.openai.beta.threads.del(this.thread.id);
      if (this.assistant) {
        await this.openai.beta.assistants.del(this.assistant.id);
      }
    }
    this.thread = null;
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
    await this.openai.beta.chat.completions
      .stream({
        model: OpenAIHelper.openAIModel,
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
      })
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
          'Sorry, Something went wrong, if the issue persists please contact us through our help center at https://github.com/orgs/geodaai/discussions/categories/bugs',
      });
      return;
    }

    const release = await this.mutex.acquire();
    // reset last message
    this.lastMessage = '';

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
      let previousFunctionName: string | null =
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
          OpenAIHelper.customFunctions[functionName];
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
          type: 'error',
          name: functionName,
          args: functionArgs,
          result: {
            success: false,
            details: `The function "${functionName}" is not executed. You can contact GeoDa.AI team for assistance. The error message is: ${err}`,
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
        if (customResponseMsg && customResponseMsg.payload) {
          if (this.lastMessage.length > 0) {
            this.lastMessage += '\n\n';
          }
          streamMessageCallback({
            deltaMessage: this.lastMessage,
            customMessage: customResponseMsg.payload,
          });
        }
      });
    }

    return finalRun;
  }
}
