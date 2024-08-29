import { OpenAIHelper } from '../src/index';
import { CallbackFunction, StreamMessageCallback } from '../src/types';

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
    result: { temperature },
    data: { temperature },
  };
  return result;
};

// callback function for stream message from OpenAI on the client side e.g. UI
const streamMessageCallback: StreamMessageCallback = ({ deltaMessage }) => {
  console.log('streamMessageCallback: ', deltaMessage);
};

async function test() {
  const apiKey = process.env.OPEN_AI_TOKEN || '';

  OpenAIHelper.configure({
    apiKey: apiKey,
    model: 'gpt-4o-mini',
    name: 'My Model',
    description: 'My Model Description',
    instructions: '',
  });

  OpenAIHelper.registerFunctionCalling({
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

  const openai = await OpenAIHelper.getInstance();

  // test processTextMessage
  const textMessage = 'Can you get the body temperature for a 40 year old man?';

  await openai.processTextMessage({
    textMessage,
    streamMessageCallback,
  });

  await openai.close();
}

test();
