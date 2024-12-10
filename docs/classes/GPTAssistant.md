[**react-ai-assist**](../README.md)

***

[react-ai-assist](../globals.md) / GPTAssistant

# Class: GPTAssistant

## Extends

- `AbstractAssistant`

## Methods

### addAdditionalContext()

> **addAdditionalContext**(`context`): `Promise`\<`void`\>

Add additional context to the conversation using OpenAI Assistants
Since OpenAI will maintain the context in a thread, so we can add additional context to the conversation
as a user message, and don't expect a response from the assistant.

#### Parameters

##### context

String to be added to the conversation context

###### callback

() => `void`

###### context

`string`

#### Returns

`Promise`\<`void`\>

#### Overrides

`AbstractAssistant.addAdditionalContext`

#### Defined in

[llm/chatgpt.ts:328](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/chatgpt.ts#L328)

***

### audioToText()

> **audioToText**(`__namedParameters`): `Promise`\<`string`\>

audio to text

#### Parameters

##### \_\_namedParameters

[`AudioToTextProps`](../type-aliases/AudioToTextProps.md)

#### Returns

`Promise`\<`string`\>

#### Overrides

`AbstractAssistant.audioToText`

#### Defined in

[llm/chatgpt.ts:296](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/chatgpt.ts#L296)

***

### close()

> **close**(): `Promise`\<`void`\>

Close the LLM instance

#### Returns

`Promise`\<`void`\>

#### Overrides

`AbstractAssistant.close`

#### Defined in

[llm/chatgpt.ts:203](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/chatgpt.ts#L203)

***

### getInstance()

> **getInstance**(): `Promise`\<`AbstractAssistant`\>

Get instance using singleton pattern

#### Returns

`Promise`\<`AbstractAssistant`\>

#### Inherited from

`AbstractAssistant.getInstance`

#### Defined in

[llm/assistant.ts:13](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/assistant.ts#L13)

***

### processImageMessage()

> **processImageMessage**(`__namedParameters`): `Promise`\<`void`\>

Process image message

#### Parameters

##### \_\_namedParameters

[`ProcessImageMessageProps`](../type-aliases/ProcessImageMessageProps.md)

#### Returns

`Promise`\<`void`\>

#### Overrides

`AbstractAssistant.processImageMessage`

#### Defined in

[llm/chatgpt.ts:370](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/chatgpt.ts#L370)

***

### processTextMessage()

> **processTextMessage**(`__namedParameters`): `Promise`\<`void`\>

Process text message

#### Parameters

##### \_\_namedParameters

[`ProcessMessageProps`](../type-aliases/ProcessMessageProps.md)

#### Returns

`Promise`\<`void`\>

#### Overrides

`AbstractAssistant.processTextMessage`

#### Defined in

[llm/chatgpt.ts:427](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/chatgpt.ts#L427)

***

### restart()

> **restart**(): `void`

Restart the chat

#### Returns

`void`

#### Inherited from

`AbstractAssistant.restart`

#### Defined in

[llm/assistant.ts:44](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/assistant.ts#L44)

***

### stop()

> **stop**(): `Promise`\<`void`\>

Stop processing

#### Returns

`Promise`\<`void`\>

#### Overrides

`AbstractAssistant.stop`

#### Defined in

[llm/chatgpt.ts:178](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/chatgpt.ts#L178)

***

### translateVoiceToText()

> **translateVoiceToText**(`audioBlob`): `Promise`\<`string`\>

Voice to text

#### Parameters

##### audioBlob

`Blob`

#### Returns

`Promise`\<`string`\>

#### Inherited from

`AbstractAssistant.translateVoiceToText`

#### Defined in

[llm/assistant.ts:58](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/assistant.ts#L58)

***

### configure()

> `static` **configure**(`__namedParameters`): `void`

Configure the LLM instance

#### Parameters

##### \_\_namedParameters

###### apiKey

`string`

###### description

`string`

###### instructions

`string`

###### model

`string`

###### name

`string`

###### temperature

`number`

###### top_p

`number`

###### version

`string`

#### Returns

`void`

#### Overrides

`AbstractAssistant.configure`

#### Defined in

[llm/chatgpt.ts:220](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/chatgpt.ts#L220)

***

### getInstance()

> `static` **getInstance**(): `Promise`\<[`GPTAssistant`](GPTAssistant.md)\>

#### Returns

`Promise`\<[`GPTAssistant`](GPTAssistant.md)\>

#### Defined in

[llm/chatgpt.ts:146](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/chatgpt.ts#L146)

***

### registerFunctionCalling()

> `static` **registerFunctionCalling**(`__namedParameters`): `void`

Register custom function for function calling

#### Parameters

##### \_\_namedParameters

[`RegisterFunctionCallingProps`](../type-aliases/RegisterFunctionCallingProps.md)

#### Returns

`void`

#### Overrides

`AbstractAssistant.registerFunctionCalling`

#### Defined in

[llm/chatgpt.ts:256](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/chatgpt.ts#L256)
