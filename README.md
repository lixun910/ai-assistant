# Introduction

AI-Assistant helps adding AI capabilities to your web and desktop applications.

## License

FlowmapBlue source code is free non-commercial usage. If you want to use it in a commercial project, please <a href="mailto:lixun910@gmail.com?subject=Ai-assistant">reach out to us</a>.

## Tutorial

Let's say you have an application that allows users to order pizza. You can use AI-Assistant to add a conversational interface to your application.

## For React Applications

In your pizza ordering application, there are two main functions that helps users to order pizza: `customizePizza` and `orderPizza`.

- The `customizePizza` allows users to customize their pizza by selecting the size, crust, and toppings.

Here is a mock implementation of the this functions:

```typescript
// customizePizza function
const customizePizza = async (
  size: number,
  crust: string,
  toppings: string[]
) => {
  const pizza = {
    size,
    crust,
    toppings,
  };
  // save the pizza to the database
  // await savePizza(pizza);
  return pizza;
};

// orderPizza function
const orderPizza = async (pizza, db) => {
  // place an order
  // const order = await placeOrder(pizza, db, user);
  return {
    orderId: '1234',
    pizza,
    price: 10,
  };
};
```

You can add an instruction to tell the AI-Assistant what the role the assistant should play in the application, so that the assistant can guide the user through the process of ordering a pizza not other things.

```tsx
<AiAssistant
  modelProvider={'OpenAI'}
  model={'gpt4o'}
  apiKey={apiKey}
  instructions="You are a pizza ordering assistant. You have only one task: 1. you can help user to customize pizza by selecting the size."
/>
```

Define function calls that will be sent to the LLM as tools for use during the conversation. The LLM can invoke these functions to perform tasks requested by the user.

```tsx
<AiAssistant
  modelProvider={'OpenAI'}
  model={'gpt4o'}
  apiKey={apiKey}
  instructions='You are a pizza ordering assistant. You have only one task: 1. you can help user to customize pizza by selecting the size.'
  functions: {[
    {
      name: 'customPizza',
      description: 'Customize a pizza with different sizes.',
      properties: {
        size: {
          type: 'number',
          description: 'The size of the pizza. Default value is 12 inches.',
        },
      },
      required: ['size'],
    }
  ]}
/>
```

The `functions` property is an array of objects that define the functions that the AI-Assistant can invoke. Each object has the following properties: `name`, `description`, `properties`, and `required`.

- `name`: The name of the function.
- `description`: A description of the function. LLM will use this description to check if the user is asking for this function based on the prompt context.
- `properties`: An object that defines the properties/arguments of the function. Each property has a `type` and a `description`.
- `required`: An array of required properties/arguments.

For example, if the user prompts "I want to customize a pizza with a size of 14 inches", the AI-Assistant will recognize that the user is asking for the `customPizza` function and will invoke the function with the provided arguments. In this case, it will be something like: `customPizza({ size: 14 })`.

Next, you need to define the callback function that will be called by the AI-Assistant.

```tsx
<AiAssistant
  modelProvider={'OpenAI'}
  model={'gpt4o'}
  apiKey={apiKey}
  instructions='You are a pizza ordering assistant. You have only one task: 1. you can help user to customize pizza by selecting the size.'
  functions: {[
    {
      name: 'customPizza',
      description: 'Customize a pizza with different sizes.',
      properties: {
        size: {
          type: 'number',
          description: 'The size of the pizza. Default value is 12 inches.',
        },
      },
      required: ['size'],
      callbackFunction: async ({ functionName, functionArgs }) => {
        const { size } = functionArgs;
        const { pizzaId } = await customizePizza(size);
        const output = {
          name: functionName,
          result: {
            content: `The custom pizza has been created successfully. The pizza id is ${pizzaId}, and the size is ${size} inches.`,
            note: 'Please return plain text message, and show the pizzaId and size in the message.',
          },
          data: { pizzaId, size },
        };
        return output;
      },
    }
  ]}
/>
```

The `callbackFunction` is an async function that takes an object with two properties: `functionName` and `functionArgs`. The `functionName` is the name of the function that the AI-Assistant is invoking, and the `functionArgs` is an object that contains the arguments of the function.

This is normally a wrapper function that calls the actual function that performs the task. In this case, the `customizePizza` function is called with the provided arguments, and the result is returned as an object with the following properties: `name`, `result`, and `data`.

- `name`: Required. The name of the function.
- `result`: Required. An object that contains the output of the function. Please note that it will be stringify as a string and sent back to the LLM as a response to the function call.
- `data`: Optional. An object that contains some data that can be used by your application for e.g. rendering additional information e.g. a image of customized pizza, a plot or a map etc., in the conversation.

[screenshot of the conversation]
The LLM will respond something like: "The custom pizza has been created successfully. The pizza id is 1234, and the size is 14 inches."

Great! Now, your pizza ordering assistant is ready to help users customize their pizza. But, in your original application, you also show the user a picture of the customized pizza. The AI assistant only returns a text message, so how can you show the picture to the user?

You can add `callbackMessage` to the function object to return a React component that will be rendered in the conversation. The `callbackMessage` is a function that takes the output object from the `callbackFunction` as an argument and returns a React component.

```tsx
<AiAssistant
  modelProvider={'OpenAI'}
  model={'gpt4o'}
  apiKey={apiKey}
  instructions='You are a pizza ordering assistant. You have only one task: 1. you can help user to customize pizza by selecting the size.'
  functions: {[
    {
      name: 'customPizza',
      description: 'Customize a pizza with different sizes.',
      properties: {
        size: {
          type: 'number',
          description: 'The size of the pizza. Default value is 12 inches.',
        },
      },
      required: ['size'],
      callbackFunction: async ({ functionName, functionArgs }) => {
        const { size } = functionArgs;
        const { pizzaId } = await customizePizza(size);
        const output = {
          name: functionName,
          result: {
            content: `The custom pizza has been created successfully. The pizza id is ${pizzaId}, and the size is ${size} inches.`,
            note: 'Please return plain text message, and show the pizzaId and size in the message.',
          },
          data: { pizzaId, size },
        };
        return output;
      },
      callbackMessage: ({ functionName, functionArgs, output }) => (
        <div className="p-4">
          <img src="https://via.placeholder.com/150" alt="pizza" />
          The custom pizza has been created successfully. The pizza id is
          {output.data.pizzaId}, and the size is {output.data.size} inches.
        </div>
      ),
    }
  ]}
/>
```

The `callbackMessage` function takes an object with three properties: `functionName`, `functionArgs`, and `output`. The `functionName` is the name of the function that the AI-Assistant is invoking, the `functionArgs` is an object that contains the arguments of the function, and the `output` is the object returned by the `callbackFunction`.

In this case, the `callbackMessage` function returns a React component that displays an image of the customized pizza and a text message with the pizza id and size.
[screenshot of the conversation with image]

Now, your pizza ordering assistant can help users customize their pizza and show them a picture of the customized pizza. 

However, in your original application, you also need to save the customized pizza to the database. How can you do that?

Let's assume you have an instance that connects to the database and it provides a method `savePizza` to save the pizza to the database. 

```ts
// simulate a database for pizza
const pizzaDatabase = {
  db: [
    {
      pizzaId: 0,
      size: 12,
    },
  ],
  savePizza: (pizzaId: number, size: number) => {
    const pizza = pizzaDatabase.db.find((p) => p.pizzaId === pizzaId);
    if (pizza) {
      pizza.size = size;
    } else {
      pizzaDatabase.db.push({ pizzaId, size });
    }
  },
};
```

You can use `callbackFunctionContext` to pass the database instance `pizzaDatabase` to the `callbackFunction` so that it can save the customized pizza to the database.

```tsx
<AiAssistant
  modelProvider={'OpenAI'}
  model={'gpt4o'}
  apiKey={apiKey}
  instructions='You are a pizza ordering assistant. You have only one task: 1. you can help user to customize pizza by selecting the size.'
  functions: {[
    {
      name: 'customPizza',
      description: 'Customize a pizza with different sizes.',
      properties: {
        size: {
          type: 'number',
          description: 'The size of the pizza. Default value is 12 inches.',
        },
      },
      required: ['size'],
      callbackFunction: async ({ functionName, functionArgs, functionContext }) => {
        const { size } = functionArgs;
        const { pizzaId } = await customizePizza(size);
        // get the pizzaDatabase instance from the functionContext
        const { pizzaDatabase } = functionContext;
        if ( pizzaDatabase ) {
          // save the pizza to the database
          pizzaDatabase.savePizza(pizzaId, size);
        }
        const output = {
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
      callbackMessage: ({ functionName, functionArgs, output }) => (
        <div className="p-4">
          <img src="https://via.placeholder.com/150" alt="pizza" />
          The custom pizza has been created successfully. The pizza id is
          {output.data.pizzaId}, and the size is {output.data.size} inches.
        </div>
      ),
    }
  ]}
/>
```

## Multiple-Step Assistant

In some cases, the assistant may need to guide the user through multiple steps to complete a task. For example, in the pizza ordering application, the user needs to customize the pizza first and then place an order.
