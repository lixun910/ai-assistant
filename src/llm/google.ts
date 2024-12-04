import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { LangChainAssistant } from './langchain';
import { AIMessageChunk, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { AudioToTextProps, ProcessImageMessageProps } from '../types';

export class GoogleAssistant extends LangChainAssistant {
  protected aiModel: ChatGoogleGenerativeAI | null = null;

  protected static instance: GoogleAssistant | null = null;

  private constructor() {
    super();

    // Initialize Google instance
    this.aiModel = new ChatGoogleGenerativeAI({
      model: GoogleAssistant.model,
      apiKey: GoogleAssistant.apiKey,
      temperature: GoogleAssistant.temperature,
      topP: GoogleAssistant.topP,
    });

    // add system message from instructions
    this.messages.push(new SystemMessage(GoogleAssistant.instructions));

    // bind tools, NOTE: can't use bind() here, it will cause error
    this.llm = this.aiModel.bindTools(GoogleAssistant.tools);
  }

  public static async getInstance(): Promise<GoogleAssistant> {
    // check if model and api key are set
    LangChainAssistant.checkModel();
    LangChainAssistant.checkApiKey();

    if (GoogleAssistant.instance === null) {
      GoogleAssistant.instance = new GoogleAssistant();
    } else if (
      LangChainAssistant.isModelChanged(
        GoogleAssistant.instance.aiModel?.modelName
      ) ||
      LangChainAssistant.isApiKeyChanged(
        GoogleAssistant.instance.aiModel?.apiKey
      )
    ) {
      // reset the aiModel if the model or api key is changed
      GoogleAssistant.instance.aiModel = new ChatGoogleGenerativeAI({
        model: GoogleAssistant.model,
        apiKey: GoogleAssistant.apiKey,
        temperature: GoogleAssistant.temperature,
        topP: GoogleAssistant.topP,
      });
    }
    return GoogleAssistant.instance;
  }

  public override restart() {
    super.restart();
    // need to reset the instance so getInstance doesn't return the same instance
    GoogleAssistant.instance = null;
  }

  private blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  public override async audioToText({
    audioBlob,
    audioBase64,
  }: AudioToTextProps): Promise<string> {
    if (this.aiModel === null) {
      throw new Error('LLM instance is not initialized');
    }

    // convert audio blob to base64 encoded string
    const audioMessage = audioBase64 || (await this.blobToBase64(audioBlob));

    const newMessage = new HumanMessage({
      content: [
        {
          type: 'text',
          text: 'Translating audio to text, and return plain text based on the following schema: {text: content}',
        },
        {
          type: 'media',
          mimeType: 'audio/wav',
          data: audioMessage,
        },
      ],
    });

    const response = await this.aiModel.invoke([newMessage]);
    const content = response.content.toString();
    // define the regex pattern to find the json object in content
    const pattern = /{[^{}]*}/;
    // match the pattern
    const match = content.match(pattern);
    if (!match) {
      return '';
    }
    // return the text content
    const transcription = JSON.parse(match[0]);
    return 'text' in transcription ? (transcription.text as string) : '';
  }

  public override async processImageMessage({
    imageMessage,
    textMessage,
    streamMessageCallback,
  }: ProcessImageMessageProps): Promise<void> {
    if (!this.llm) {
      throw new Error('LLM instance is not initialized');
    }

    if (!this.abortController) {
      this.abortController = new AbortController();
    }

    const newMessage = new HumanMessage({
      content: [
        {
          type: 'text',
          text: textMessage,
        },
        {
          type: 'image_url',
          image_url: imageMessage,
        },
      ],
    });

    // @ts-expect-error Fix issue that message.getType is not a function in @langchain/google-genai
    newMessage.getType = () => null;

    const stream = await this.llm.stream([newMessage], {
      signal: this.abortController?.signal,
    });

    let message = '';
    const chunks: AIMessageChunk[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
      if (chunk.content.length > 0) {
        message += chunk.content.toString();
        streamMessageCallback({ deltaMessage: message });
      }
    }

    streamMessageCallback({ deltaMessage: message, isCompleted: true });
  }
}
