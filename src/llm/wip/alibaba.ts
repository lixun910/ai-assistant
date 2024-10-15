import { AbstractAssistant } from '../assistant';
import {
  AIMessageChunk,
  BaseMessage,
  ChatMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import {
  CustomFunctionOutputProps,
  CustomFunctions,
  AudioToTextProps,
  ProcessImageMessageProps,
  ProcessMessageProps,
  RegisterFunctionCallingProps,
} from '../../types';
import { BindToolsInput } from '@langchain/core/language_models/chat_models';
import { Runnable } from '@langchain/core/runnables';
import {
  ChatAlibabaQwenAudio,
  ChatAlibabaQwenVL,
  CustomChatAlibabaTongyi,
} from './tongyi';

export class AlibabaAssistant extends AbstractAssistant {
  private tongyi: CustomChatAlibabaTongyi;

  // private visionModel: ChatAlibabaQwenVL;

  // private audioModel: ChatAlibabaQwenAudio;

  private llm: Runnable;

  private messages: BaseMessage[] = [];

  private static customFunctions: CustomFunctions = {};

  private static model = 'qwen-max';

  private static visionModel = 'qwen-vl-plus';

  // Note: qwen-audio-turbo, qwen-audio-chat
  private static audioModel = 'qwen2-audio-instruct';

  private static instructions = '';

  private static apiKey = '';

  private static baseUrl =
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';

  // note: this url seems not working with base64 image: https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation
  private static visionBaseUrl =
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

  private static audioBaseUrl =
    'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation';

  private static resultFormat: 'message' | 'text' = 'message';

  private static tools: BindToolsInput[] = [];

  private static instance: AlibabaAssistant | null = null;

  private constructor() {
    super();

    // Initialize Tongyi instance
    this.tongyi = new CustomChatAlibabaTongyi({
      model: AlibabaAssistant.model,
      modelName: AlibabaAssistant.model,
      alibabaApiKey: AlibabaAssistant.apiKey,
      streaming: false,
      resultFormat: AlibabaAssistant.resultFormat,
      apiUrl: AlibabaAssistant.baseUrl,
    });

    // add system message from instructions
    this.messages.push(new SystemMessage(AlibabaAssistant.instructions));

    // bind tools
    this.llm = this.tongyi.bind({
      // @ts-ignore
      tools: AlibabaAssistant.tools,
    });

    // Initialize Qwen Vision Language Model
    // this.visionModel = new ChatAlibabaQwenVL({
    //   model: AlibabaAssistant.visionModel,
    //   modelName: AlibabaAssistant.visionModel,
    //   alibabaApiKey: AlibabaAssistant.apiKey,
    //   streaming: true,
    //   resultFormat: AlibabaAssistant.resultFormat,
    //   apiUrl: AlibabaAssistant.visionBaseUrl,
    // });

    // Initialize Qwen Audio Language Model
    // this.audioModel = new ChatAlibabaQwenAudio({
    //   model: AlibabaAssistant.audioModel,
    //   modelName: AlibabaAssistant.audioModel,
    //   alibabaApiKey: AlibabaAssistant.apiKey,
    //   streaming: true,
    //   resultFormat: AlibabaAssistant.resultFormat,
    //   apiUrl: AlibabaAssistant.audioBaseUrl,
    // });
  }

  public static async getInstance(): Promise<AlibabaAssistant> {
    if (AlibabaAssistant.instance === null) {
      AlibabaAssistant.instance = new AlibabaAssistant();
    }
    return AlibabaAssistant.instance;
  }

  public static override async configure({
    model,
    visionModel,
    audioModel,
    instructions,
    apiKey,
    baseUrl,
    visionBaseUrl,
    audioBaseUrl,
    resultFormat,
  }: {
    model?: string;
    visionModel?: string;
    audioModel?: string;
    instructions?: string;
    apiKey?: string;
    baseUrl?: string;
    visionBaseUrl?: string;
    audioBaseUrl?: string;
    resultFormat?: 'message' | 'text';
  }) {
    if (model) AlibabaAssistant.model = model;
    if (visionModel) AlibabaAssistant.visionModel = visionModel;
    if (audioModel) AlibabaAssistant.audioModel = audioModel;
    if (instructions) AlibabaAssistant.instructions = instructions;
    if (apiKey) AlibabaAssistant.apiKey = apiKey;
    if (baseUrl) AlibabaAssistant.baseUrl = baseUrl;
    if (visionBaseUrl) AlibabaAssistant.visionBaseUrl = visionBaseUrl;
    if (audioBaseUrl) AlibabaAssistant.audioBaseUrl = audioBaseUrl;
    if (resultFormat) AlibabaAssistant.resultFormat = resultFormat;
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
    // register custom function
    AlibabaAssistant.customFunctions[name] = {
      func: callbackFunction,
      context: callbackFunctionContext,
      callbackMessage,
    };

    // add function calling to tools
    AlibabaAssistant.tools.push({
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

  public override async processTextMessage({
    textMessage,
    streamMessageCallback,
  }: ProcessMessageProps) {
    this.messages.push(new HumanMessage(textMessage));

    let stream = await this.llm.stream(this.messages);

    let finalChunk;

    for await (const chunk of stream) {
      finalChunk = chunk;
      if (chunk.content.length > 0) {
        streamMessageCallback({ deltaMessage: chunk.content.toString() });
      }
    }

    this.messages.push(finalChunk);

    if (finalChunk.tool_calls) {
      const functionOutput: CustomFunctionOutputProps<unknown, unknown>[] = [];

      for (const toolCall of finalChunk.tool_calls) {
        const functionName = toolCall.function.name;
        const functionArgs =
          typeof toolCall.function.arguments === 'string'
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
        try {
          const { func, context, callbackMessage } =
            AlibabaAssistant.customFunctions[functionName];

          const output = await func({
            functionName,
            functionArgs,
            functionContext: context,
            previousOutput: functionOutput,
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
              details: `The function "${functionName}" is not executed. The error message is: ${err}`,
            },
          });
        }

        // compose output message
        functionOutput.map((output) => {
          const toolMessage = new ToolMessage(
            { content: JSON.stringify(output.result) },
            toolCall.id || '',
            toolCall.function.name
          );
          this.messages.push(toolMessage);
        });
      }

      if (functionOutput.length > 0) {
        const stream = await this.llm.stream(this.messages);
        for await (const chunk of stream) {
          console.log(`${chunk.content}`);
          streamMessageCallback({ deltaMessage: chunk.content.toString() });
        }
      }
    }
  }

  public override async processImageMessage({
    imageMessage,
    textMessage,
    streamMessageCallback,
  }: ProcessImageMessageProps) {
    // // create temporary message for image
    // const userMessage = new ChatMessage({
    //   role: 'user',
    //   content: [
    //     {
    //       type: 'text',
    //       text: textMessage,
    //     },
    //     {
    //       type: 'image_url',
    //       image_url: imageMessage,
    //     },
    //   ],
    // });
    // const stream = await this.visionModel.stream([userMessage]);
    // for await (const chunk of stream) {
    //   streamMessageCallback({ deltaMessage: chunk.content.toString() });
    // }
  }

  public override async audioToText({
    audioBlob,
    streamMessageCallback,
  }: AudioToTextProps): Promise<string> {
    //   const userMessage = new ChatMessage({
    //     role: 'user',
    //     content: [
    //       {
    //         audio: audioMessage,
    //       },
    //       {
    //         text: '请输出音频内容',
    //       },
    //     ],
    //   });

    //   const stream = await this.audioModel.stream([userMessage]);

    //   for await (const chunk of stream) {
    //     streamMessageCallback({ deltaMessage: chunk.content.toString() });
    //   }
    throw new Error('Method not implemented.');
  }
}
