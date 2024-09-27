import type { Meta, StoryObj } from '@storybook/react';

import { AiAssistant } from './assistant';
import {
  CustomFunctionOutputProps,
  MessageModel,
  RegisterFunctionCallingProps,
} from '../types';

const meta = {
  component: AiAssistant,
  decorators: [
    (Story: any) => (
      <div className="rounded p-4 w-[400px] h-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AiAssistant>;

export default meta;

type Story = StoryObj<typeof meta>;

const historyMessages: MessageModel[] = [
  {
    message: 'Hi, I am your assistant. How can I help you today?',
    sentTime: 'just now',
    sender: 'LLM',
    direction: 'incoming',
    position: 'first',
  },
  {
    message: 'What is your name?',
    sentTime: 'just now',
    sender: 'user',
    direction: 'outgoing',
    position: 'normal',
  },
  {
    message: 'I am LLM, your assistant.',
    sentTime: 'just now',
    sender: 'LLM',
    direction: 'incoming',
    position: 'normal',
  },
];

const welcomeMessage = 'Hi, I am your assistant. How can I help you today?';

const instructions =
  'You are a helpful assistant. You can help user to customize pizza by selecting the size. You can also help user to order the pizza.';

type CustomPizzaOutput = CustomFunctionOutputProps<
  {
    content: string;
    note: string;
  },
  {
    pizzaId: number;
    size: number;
  }
> & {
  type: 'CustomPizzaOutput';
};

async function customizePizza(size: number) {
  // simulate a long running task
  // wait 0.5 second
  await new Promise((resolve) => setTimeout(resolve, 500));

  const pizzaId = Math.floor(Math.random() * 1000);

  return {
    pizzaId,
    size,
  };
}

// simulate a database for pizza
type PizzaDatabase = {
  db: { pizzaId: number; size: number }[];
  updateSize: (pizzaId: number, size: number) => void;
};
const pizzaDatabase: PizzaDatabase = {
  db: [
    {
      pizzaId: 0,
      size: 12,
    },
  ],
  updateSize: (pizzaId: number, size: number) => {
    const pizza = pizzaDatabase.db.find((p) => p.pizzaId === pizzaId);
    if (pizza) {
      pizza.size = size;
    } else {
      pizzaDatabase.db.push({ pizzaId, size });
    }
  },
};

// type guard to ensure pizzaDatabase is type of PizzaDatabase
const isPizzaDatabase = (obj: any): obj is PizzaDatabase => {
  return 'db' in obj && 'updateSize' in obj;
};

// type guard if object is CustomPizzaOutput
const isCustomPizzaOutput = (obj: any): obj is CustomPizzaOutput => {
  return 'type' in obj && obj.type === 'CustomPizzaOutput';
};

type OrderPizzaOutput = CustomFunctionOutputProps<
  {
    content: string;
  },
  {
    numberOfPizzas: number;
    pizzaId: number;
    price: number;
  }
> & {
  type: 'OrderPizzaOutput';
};

const isOrderPizzaOutput = (obj: any): obj is OrderPizzaOutput => {
  return 'type' in obj && obj.type === 'OrderPizzaOutput';
};

const functions: RegisterFunctionCallingProps[] = [
  {
    name: 'customPizza',
    description: 'Customize a pizza with different size.',
    properties: {
      size: {
        type: 'number',
        description: 'The size of the pizza. Default value is 12 inches.',
      },
    },
    required: ['size'],
    callbackFunction: async ({
      functionName,
      functionArgs,
      functionContext,
    }) => {
      const size = parseInt(functionArgs.size as string);
      const { pizzaId } = await customizePizza(size);

      if (functionContext && 'pizzaDatabase' in functionContext) {
        const { pizzaDatabase } = functionContext;
        // type guard to ensure pizzaDatabase is type of PizzaDatabase
        if (isPizzaDatabase(pizzaDatabase)) {
          pizzaDatabase.updateSize(pizzaId, size);
          console.log(pizzaDatabase.db);
        }
      }

      const output = {
        type: 'CustomPizzaOutput',
        name: functionName,
        result: {
          content: `The custom pizza has been created successfully. The pizza id is ${pizzaId}, and the size is ${size} inches.`,
          note: 'Please return plain text message, and show the pizzaId and size in the message.',
        },
        data: { pizzaId, size },
      };
      return output;
    },
    callbackFunctionContext: { pizzaDatabase },
    callbackMessage: ({ functionName, functionArgs, output }) => {
      if (output && isCustomPizzaOutput(output)) {
        return (
          <div className="p-4">
            <img src="https://via.placeholder.com/150" alt="pizza" />
            The custom pizza has been created successfully. The pizza id is{' '}
            {output.data?.pizzaId}, and the size is {output.data?.size} inches.
          </div>
        );
      }
    },
  },
  {
    name: 'orderPizza',
    description: 'Order a customized pizza.',
    properties: {
      pizzaId: {
        type: 'number',
        description: 'The pizza id of the customized pizza.',
      },
      numberOfPizzas: {
        type: 'number',
        description: 'The number of pizzas to order.',
      },
    },
    required: ['numberOfPizzas'],
    callbackFunction: async ({
      functionName,
      functionArgs,
      previousOutput,
    }) => {
      let pizzaId = functionArgs.pizzaId
        ? parseInt(functionArgs.pizzaId as string)
        : 0;
      if (previousOutput) {
        // reverse the previous output to get the latest custom pizza output
        const reverseOutput = [...previousOutput].reverse();
        const customPizzaOutput = reverseOutput.find((output) => isCustomPizzaOutput(output));
        pizzaId = customPizzaOutput?.data?.pizzaId || 0;
      }
      const numberOfPizzas = parseInt(functionArgs.numberOfPizzas as string);
      const price = 12.0 * numberOfPizzas;

      return {
        type: 'OrderPizzaOutput',
        name: functionName,
        result: {
          content: `${numberOfPizzas} pizza with id ${pizzaId} has been ordered successfully. The total price is $${price}.`,
        },
        data: { pizzaId, numberOfPizzas, price },
      };
    },
    callbackMessage: ({ functionName, functionArgs, output }) => {
      if (output && isOrderPizzaOutput(output)) {
        return (
          <div className="p-4">
            {output.data?.numberOfPizzas} pizza with id {output.data?.pizzaId}{' '}
            has been ordered successfully. The total price is $
            {output.data?.price}.
          </div>
        );
      }
    },
  },
];

export const Default: Story = {
  args: {
    modelProvider: 'openai',
    model: '',
    apiKey: '',
    welcomeMessage: 'Hi, I am your assistant. How can I help you today?',
    instructions: '',
    functions: [],
  },
};

export const Dark: Story = {
  args: {
    theme: 'dark',
    modelProvider: 'openai',
    model: '',
    apiKey: '',
    welcomeMessage,
    instructions: '',
    functions: [],
    historyMessages: historyMessages,
  },
};

export const OpenAI: Story = {
  args: {
    modelProvider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY || '',
    welcomeMessage,
    instructions,
    functions,
  },
};

export const Gemini: Story = {
  args: {
    modelProvider: 'google',
    model: 'gemini-1.5-flash',
    apiKey: process.env.GEMINI_TOKEN || '',
    welcomeMessage,
    instructions,
    functions,
  },
};

export const Ollama: Story = {
  args: {
    modelProvider: 'ollma',
    model: 'llama3.1',
    apiKey: '',
    welcomeMessage,
    instructions,
    functions,
  },
};

export const Alibaba: Story = {
  args: {
    modelProvider: 'Alibaba',
    model: 'qwen2',
    apiKey: '',
    welcomeMessage,
    instructions,
    functions,
  },
};
