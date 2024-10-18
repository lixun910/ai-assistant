import {
  AIMessageChunk,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import {
  GoogleAssistant,
  GPTAssistant,
  OllamaAssistant,
  OpenAIAssistant,
  testGeminiConnection,
  testOllamConnection,
  testOpenAIChatGPTConnection,
} from '../src/index';
import {
  CallbackFunction,
  CustomFunctionCall,
  StreamMessageCallback,
} from '../src/types';
import { ChatOpenAI, OpenAI } from '@langchain/openai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { ChatOllama } from '@langchain/ollama';

const TEST_IMAGE =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAApgAAAKYB3X3/OAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAANCSURBVEiJtZZPbBtFFMZ/M7ubXdtdb1xSFyeilBapySVU8h8OoFaooFSqiihIVIpQBKci6KEg9Q6H9kovIHoCIVQJJCKE1ENFjnAgcaSGC6rEnxBwA04Tx43t2FnvDAfjkNibxgHxnWb2e/u992bee7tCa00YFsffekFY+nUzFtjW0LrvjRXrCDIAaPLlW0nHL0SsZtVoaF98mLrx3pdhOqLtYPHChahZcYYO7KvPFxvRl5XPp1sN3adWiD1ZAqD6XYK1b/dvE5IWryTt2udLFedwc1+9kLp+vbbpoDh+6TklxBeAi9TL0taeWpdmZzQDry0AcO+jQ12RyohqqoYoo8RDwJrU+qXkjWtfi8Xxt58BdQuwQs9qC/afLwCw8tnQbqYAPsgxE1S6F3EAIXux2oQFKm0ihMsOF71dHYx+f3NND68ghCu1YIoePPQN1pGRABkJ6Bus96CutRZMydTl+TvuiRW1m3n0eDl0vRPcEysqdXn+jsQPsrHMquGeXEaY4Yk4wxWcY5V/9scqOMOVUFthatyTy8QyqwZ+kDURKoMWxNKr2EeqVKcTNOajqKoBgOE28U4tdQl5p5bwCw7BWquaZSzAPlwjlithJtp3pTImSqQRrb2Z8PHGigD4RZuNX6JYj6wj7O4TFLbCO/Mn/m8R+h6rYSUb3ekokRY6f/YukArN979jcW+V/S8g0eT/N3VN3kTqWbQ428m9/8k0P/1aIhF36PccEl6EhOcAUCrXKZXXWS3XKd2vc/TRBG9O5ELC17MmWubD2nKhUKZa26Ba2+D3P+4/MNCFwg59oWVeYhkzgN/JDR8deKBoD7Y+ljEjGZ0sosXVTvbc6RHirr2reNy1OXd6pJsQ+gqjk8VWFYmHrwBzW/n+uMPFiRwHB2I7ih8ciHFxIkd/3Omk5tCDV1t+2nNu5sxxpDFNx+huNhVT3/zMDz8usXC3ddaHBj1GHj/As08fwTS7Kt1HBTmyN29vdwAw+/wbwLVOJ3uAD1wi/dUH7Qei66PfyuRj4Ik9is+hglfbkbfR3cnZm7chlUWLdwmprtCohX4HUtlOcQjLYCu+fzGJH2QRKvP3UNz8bWk1qMxjGTOMThZ3kvgLI5AzFfo379UAAAAASUVORK5CYII=';

const TEST_AUDIO =
  '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';

// local native function in existing system
function getBodyTemperature({ age }) {
  let bodyTemperature = 0;

  if (age < 2) {
    bodyTemperature = 37.5;
  } else if (age >= 2 && age < 5) {
    bodyTemperature = 37.0;
  } else if (age >= 5 && age < 65) {
    bodyTemperature = 36.8;
  } else {
    bodyTemperature = 36.4;
  }

  return bodyTemperature;
}

// wrapper function of the native function that will be called by OpenAI
const getBodyTemperatureCallback: CallbackFunction = ({
  functionName,
  functionArgs,
}) => {
  const { age } = functionArgs;
  const temperature = getBodyTemperature({ age });
  const result = {
    type: 'number',
    name: functionName,
    result: { temperature }, // send to LLM
    data: { temperature }, // used by UI
  };
  return result;
};

const getBodyTemperatureMessage = ({
  functionName,
  functionArgs,
  output,
}: CustomFunctionCall) => {
  // use output to generate the message, e.g. chart, map etc.
  const { result, data } = output;
  return null;
};

// callback function for stream message from OpenAI on the client side e.g. UI
const streamMessageCallback: StreamMessageCallback = ({ deltaMessage }) => {
  console.log('streamMessageCallback: ', deltaMessage);
};

async function testChatGPT() {
  const apiKey = process.env.OPEN_AI_TOKEN || '';

  GPTAssistant.configure({
    apiKey: apiKey,
    model: 'gpt-4o-mini',
    name: 'My Model',
    description: 'My Model Description',
    instructions:
      'You are a programmer, and you are trying to get the body temperature of a person based on their age.',
  });

  GPTAssistant.registerFunctionCalling({
    name: 'getBodyTemperature',
    description: 'Get current body temperature based on different age',
    properties: {
      age: {
        type: 'number',
        description: 'the age of the person',
      },
    },
    required: ['age'],
    callbackFunction: getBodyTemperatureCallback,
    callbackMessage: getBodyTemperatureMessage,
  });

  const openai = await GPTAssistant.getInstance();

  // test processTextMessage
  const textMessage = 'Can you get the body temperature for a 40 year old man?';

  await openai.processTextMessage({
    textMessage,
    streamMessageCallback,
  });

  await openai.close();
}

// async function testGemini() {
//   const apiKey = process.env.GEMINI_TOKEN || '';

//   GeminiAssistant.configure({
//     apiKey: apiKey,
//     model: 'gpt-4o-mini',
//     instructions: '',
//   });

//   GeminiAssistant.registerFunctionCalling({
//     name: 'getBodyTemperature',
//     description: 'Get current body temperature based on different age',
//     properties: {
//       age: {
//         type: 'number',
//         description: 'the age of the person',
//       },
//     },
//     required: ['age'],
//     callbackFunction: getBodyTemperatureCallback,
//   });

//   const gemini = await GeminiAssistant.getInstance();

//   // test processTextMessage
//   const textMessage = 'Can you get the body temperature for a 40 year old man?';

//   await gemini.processTextMessage({
//     textMessage,
//     streamMessageCallback,
//   });
// }

/**
 * Note that the descriptions here are crucial, as they will be passed along
 * to the model along with the class name.
 */
const calculatorSchema = z.object({
  operation: z
    .enum(['add', 'subtract', 'multiply', 'divide'])
    .describe('The type of operation to execute.'),
  number1: z.number().describe('The first number to operate on.'),
  number2: z.number().describe('The second number to operate on.'),
});

async function testLangChain() {
  const model = new ChatOpenAI({
    model: 'gpt-4o-mini',
    temperature: 0,
  });

  const temperatureTool = tool(
    async ({ age }) => {
      return getBodyTemperature({ age });
    },
    {
      name: 'bodyTemperature',
      description: 'Get the body temperature based on age.',
      schema: z.object({
        age: z.number().min(0).max(150),
      }),
    }
  );

  const llmWithTools = model.bind({
    tools: [
      {
        type: 'function',
        function: {
          name: 'bodyTemperature',
          description: 'Get the body temperature based on age.',
          parameters: {
            type: 'object',
            properties: {
              age: {
                type: 'number',
                description: 'The age of the person.',
                default: 40,
              },
            },
            required: ['age'],
          },
        },
      },
    ],
  });

  // const inputMessagesKey = 'input';
  // const historyMessagesKey = 'history';

  const messages = [new SystemMessage('You are a cat.')];

  // // create a simple runnable which just chains the prompt to the model
  // const runnable = chatPrompt.pipe(llmWithTools);

  // // define your session history store
  // // this is where you will store your chat history
  // const messageHistory = new ChatMessageHistory();

  // // create your RunnableWithMessageHistory object, passing in the runnable created above
  // const withHistory = new RunnableWithMessageHistory({
  //   runnable,
  //   // optionally, you can use a function which tracks history by session ID
  //   getMessageHistory: (_sessionId: string) => messageHistory,
  //   inputMessagesKey,
  //   historyMessagesKey,
  // });

  // // create configuration object, where you pass in the `sessionId` to track history
  // const config: RunnableConfig = { configurable: { sessionId: '1' } };

  // pass in your question using input key
  messages.push(new HumanMessage('Hi, my name is George.'));
  let output = await llmWithTools.invoke(messages);
  console.log(output);

  messages.push(output);

  messages.push(new HumanMessage('What is my name?'));
  let stream = await llmWithTools.stream(messages);

  let chunks: AIMessageChunk[] = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
    console.log(`${chunk.content}`);
  }

  let finalChunk = chunks[0];
  for (const chunk of chunks.slice(1, 5)) {
    finalChunk = finalChunk.concat(chunk);
  }

  messages.push(finalChunk);

  messages.push(
    new HumanMessage('Can you get the body temperature for a 40 year old man?')
  );
  stream = await llmWithTools.stream(messages);

  const toolsByName = {
    bodyTemperature: temperatureTool,
  };

  chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
    if (chunk.content.length > 0) {
      console.log(`${chunk.content}`);
    }
  }

  finalChunk = chunks[0];
  for (const chunk of chunks.slice(1, 5)) {
    finalChunk = finalChunk.concat(chunk);
  }

  messages.push(finalChunk);
  console.log('finalChunk: ', finalChunk);

  if (finalChunk.tool_calls) {
    const toolCallsContent = finalChunk.tool_calls.map((toolCall) => ({
      name: toolCall.name,
      parameters: toolCall.args,
    }));

    // messages.push(new ChatMessage(JSON.stringify(toolCallsContent), 'assistant'));
    for (const toolCall of finalChunk.tool_calls) {
      console.log('toolCall: ', toolCall);
      const selectedTool = toolsByName[toolCall.name];
      const toolMessage: ToolMessage = await selectedTool.invoke(toolCall);
      // const toolMessage = selectedTool({
      //   functionName: toolCall.name,
      //   functionArgs: toolCall.args,
      // });
      console.log('toolMessage: ', toolMessage);

      messages.push(toolMessage);
    }

    console.log('messages: ', messages);
    stream = await llmWithTools.stream(messages);
    chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
      console.log(`${chunk.content}`);
    }
    finalChunk = chunks[0];
    for (const chunk of chunks.slice(1, 5)) {
      finalChunk = finalChunk.concat(chunk);
    }

    messages.push(finalChunk);
  }
}

async function testOllama() {
  OllamaAssistant.configure({
    model: 'llama3.1',
    instructions:
      'You are a programmer, and you are trying to get the body temperature of a person based on their age.',
  });

  OllamaAssistant.registerFunctionCalling({
    name: 'getBodyTemperature',
    description: 'Get current body temperature based on different age',
    properties: {
      age: {
        type: 'number',
        description: 'the age of the person',
      },
    },
    required: ['age'],
    callbackFunction: getBodyTemperatureCallback,
  });

  const assistant = await OllamaAssistant.getInstance();

  await assistant.processTextMessage({
    textMessage: 'what is your name?',
    streamMessageCallback,
  });

  // test processTextMessage
  const textMessage = '四十岁的男人体温应该是多少?';

  await assistant.processTextMessage({
    textMessage,
    streamMessageCallback,
  });
}

async function OllamaWithTools() {
  const ollama = new ChatOllama({
    model: 'llama3.1',
    streaming: true,
  }).bind({
    tools: [
      {
        type: 'function',
        function: {
          name: 'roomTemperature',
          description: 'get my current room temperature',
          parameters: {
            type: 'object',
            properties: {},
          },
        },
      },
    ],
  });

  const messages = [
    new SystemMessage('You are a helpful AI assistant that can use tools.'),
    new HumanMessage('What is the temperature in my room?'),
  ];

  const stream = await ollama.stream(messages);

  let finalChunk: AIMessageChunk = new AIMessageChunk('');

  let output = '';
  for await (const chunk of stream) {
    output += chunk.content;
    console.log(output);
    console.log(chunk);
    finalChunk = finalChunk.concat(chunk);
  }

  console.log('finalChunk: ', finalChunk);
}

// async function QwenTest() {
//   AlibabaAssistant.configure({
//     model: 'qwen-max',
//     apiKey: process.env.DASHSCOPE_API_KEY || '',
//     instructions:
//       'You are a programmer, and you are trying to get the body temperature of a person based on their age.',
//   });

//   AlibabaAssistant.registerFunctionCalling({
//     name: 'getBodyTemperature',
//     description: 'Get current body temperature based on different age',
//     properties: {
//       age: {
//         type: 'number',
//         description: 'the age of the person',
//       },
//     },
//     required: ['age'],
//     callbackFunction: getBodyTemperatureCallback,
//   });

//   const assistant = await AlibabaAssistant.getInstance();

//   // await assistant.processTextMessage({
//   //   textMessage: 'what is your name?',
//   //   streamMessageCallback,
//   // });

//   // test processTextMessage
//   const textMessage = 'Can you get the body temperature for a 40 year old man?';

//   await assistant.processTextMessage({
//     textMessage,
//     streamMessageCallback,
//   });
// }

async function testQwenViaOllama() {
  OllamaAssistant.configure({
    model: 'qwen2',
    instructions:
      'You are a programmer, and you are trying to get the body temperature of a person based on their age.',
  });

  OllamaAssistant.registerFunctionCalling({
    name: 'getBodyTemperature',
    description: 'Get current body temperature based on different age',
    properties: {
      age: {
        type: 'number',
        description: 'the age of the person',
      },
    },
    required: ['age'],
    callbackFunction: getBodyTemperatureCallback,
  });

  const assistant = await OllamaAssistant.getInstance();

  await assistant.processTextMessage({
    textMessage: 'what is your name?',
    streamMessageCallback,
  });

  // test processTextMessage
  const textMessage = '四十岁的男人体温应该是多少?';

  await assistant.processTextMessage({
    textMessage,
    streamMessageCallback,
  });

  await assistant.processImageMessage({
    textMessage: 'what is this?',
    imageMessage: TEST_IMAGE,
    streamMessageCallback,
  });
}

// async function testQwenVL() {
//   AlibabaAssistant.configure({
//     model: 'qwen-vl-plus',
//     apiKey: process.env.DASHSCOPE_API_KEY || '',
//     resultFormat: 'text',
//     baseUrl:
//       'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
//     instructions: 'You are a cat',
//   });

//   const assistant = await AlibabaAssistant.getInstance();

//   await assistant.processImageMessage({
//     imageMessage: TEST_IMAGE,
//     // 'https://dashscope.oss-cn-beijing.aliyuncs.com/images/tiger.png',
//     textMessage: '这是什么?',
//     streamMessageCallback,
//   });
// }

function convertURIToBinary(dataURI) {
  let BASE64_MARKER = ';base64,';
  let base64Index = dataURI.indexOf(BASE64_MARKER) + BASE64_MARKER.length;
  let base64 = dataURI.substring(base64Index);
  let raw = Buffer.from(base64).toString('base64');
  let rawLength = raw.length;
  let arr = new Uint8Array(new ArrayBuffer(rawLength));

  for (let i = 0; i < rawLength; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

// async function testQwenAudio() {
//   AlibabaAssistant.configure({
//     model: 'qwen2-audio-instruct',
//     apiKey: process.env.DASHSCOPE_API_KEY || '',
//     resultFormat: 'text',
//     baseUrl:
//       'https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation',
//   });

//   const assistant = await AlibabaAssistant.getInstance();

//   // await assistant.audioToText({
//   //   audioMessage:
//   //     'https://dashscope.oss-cn-beijing.aliyuncs.com/samples/audio/paraformer/hello_world_male2.wav',
//   //   streamMessageCallback,
//   // });

//   const audioMessage = 'data:application/octet-stream;base64,' + TEST_AUDIO;
//   const binary = convertURIToBinary(audioMessage);
//   const blob = new Blob([binary], { type: 'audio/wav' });
//   const formData = new FormData();
//   formData.append('audioFile', blob, 'audio.wav');

//   await assistant.audioToText({
//     // @ts-ignore
//     audioMessage: formData.get('audioFile'),
//     streamMessageCallback,
//   });
// }

async function testGoogle() {
  GoogleAssistant.configure({
    apiKey: process.env.GEMINI_TOKEN,
    model: 'gemini-1.5-flash',
    instructions: 'You ara a cat.',
  });
  GoogleAssistant.registerFunctionCalling({
    name: 'getBodyTemperature',
    description: 'Get current body temperature based on different age',
    properties: {
      age: {
        type: 'number',
        description: 'the age of the person',
      },
    },
    required: ['age'],
    callbackFunction: getBodyTemperatureCallback,
  });

  const assistant = await GoogleAssistant.getInstance();

  await assistant.processTextMessage({
    textMessage: 'Hi, My name is George. What is your name?',
    streamMessageCallback,
  });

  await assistant.processTextMessage({
    textMessage: 'Do you know my name?',
    streamMessageCallback,
  });

  // test processTextMessage
  const textMessage = 'Can you get the body temperature for a 40 year old man?';

  await assistant.processTextMessage({
    textMessage,
    streamMessageCallback,
  });

  // await assistant.processImageMessage({
  //   textMessage: 'what is this?',
  //   imageMessage: TEST_IMAGE,
  //   streamMessageCallback,
  // });

  const transcription = await assistant.audioToText({
    audioBase64: TEST_AUDIO,
  });

  console.log('transcription: ', transcription);
}

async function testOpenAI() {
  OpenAIAssistant.configure({
    apiKey: process.env.OPEN_AI_TOKEN,
    model: 'gpt-4o',
    instructions: 'You ara a cat.',
  });
  OpenAIAssistant.registerFunctionCalling({
    name: 'getBodyTemperature',
    description: 'Get current body temperature based on different age',
    properties: {
      age: {
        type: 'number',
        description: 'the age of the person',
      },
    },
    required: ['age'],
    callbackFunction: getBodyTemperatureCallback,
  });

  const assistant = await OpenAIAssistant.getInstance();

  await assistant.processTextMessage({
    textMessage: 'Hi, My name is George. What is your name?',
    streamMessageCallback,
  });

  await assistant.processTextMessage({
    textMessage: 'Do you know my name?',
    streamMessageCallback,
  });

  // test processTextMessage
  const textMessage = 'Can you get the body temperature for a 40 year old man?';

  await assistant.processTextMessage({
    textMessage,
    streamMessageCallback,
  });

  await assistant.processImageMessage({
    textMessage: 'what is this?',
    imageMessage: TEST_IMAGE,
    streamMessageCallback,
  });

  // const audioMessage = 'data:application/octet-stream;base64,' + TEST_AUDIO;
  // const binary = convertURIToBinary(audioMessage);
  // const blob = new Blob([binary], { type: 'audio/wav' });

  // await assistant.audioToText({
  //   audioBlob: blob,
  // });
}

// testGemini();
// testLangChain();
// testOllama();
// OllamaWithTools();
// QwenTest();
// testQwenViaOllama();
// testQwenVL();
// testQwenAudio();
// testGoogle();
// testOpenAI();

// testOllamConnection('llama3.1', 'http://127.0.0.1:11434');