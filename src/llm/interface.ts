import { ProcessImageMessageProps, ProcessMessageProps, RegisterFunctionCallingProps } from '../types';

export class AbstractLLM {
  /**
   * Get instance using singleton pattern
   */
  public async getInstance(): Promise<AbstractLLM> {
    throw new Error('Method not implemented.');
  }

  /**
   * Configure the LLM instance
   */
  public static configure(props: { apiKey: string }) {
    throw new Error('Method not implemented.');
  }

  /**
   * Close the LLM instance
   */
  public async close() {
    throw new Error('Method not implemented.');
  }

  /**
   * Process image message
   */
  public async processImageMessage(props: ProcessImageMessageProps) {
    throw new Error('Method not implemented.');
  }

  /**
   * Voice to text
   */
  public async translateVoiceToText(audioBlob: Blob): Promise<string> {
    throw new Error('Method not implemented.');
  }

  /**
   * Process text message
   */
  public async processTextMessage(props: ProcessMessageProps) {
    throw new Error('Method not implemented.');
  }

  /**
   * Register custom function for function calling
   */
  public static registerFunctionCalling(props: RegisterFunctionCallingProps) {
    throw new Error('Method not implemented.');
  }
}
