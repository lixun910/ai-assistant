[**react-ai-assist**](../README.md)

***

[react-ai-assist](../globals.md) / GoogleAssistant

# Class: GoogleAssistant

## Extends

- `LangChainAssistant`

## Methods

### addAdditionalContext()

> **addAdditionalContext**(`__namedParameters`): `Promise`\<`void`\>

Add additional context to the conversation, so LLM can understand the context better

#### Parameters

##### \_\_namedParameters

###### context

`string`

#### Returns

`Promise`\<`void`\>

#### Inherited from

`LangChainAssistant.addAdditionalContext`

#### Defined in

[llm/langchain.ts:130](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/langchain.ts#L130)

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

`LangChainAssistant.audioToText`

#### Defined in

[llm/google.ts:69](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/google.ts#L69)

***

### close()

> **close**(): `Promise`\<`void`\>

Close the LLM instance

#### Returns

`Promise`\<`void`\>

#### Inherited from

`LangChainAssistant.close`

#### Defined in

[llm/assistant.ts:30](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/assistant.ts#L30)

***

### getInstance()

> **getInstance**(): `Promise`\<`AbstractAssistant`\>

Get instance using singleton pattern

#### Returns

`Promise`\<`AbstractAssistant`\>

#### Inherited from

`LangChainAssistant.getInstance`

#### Defined in

[llm/assistant.ts:13](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/assistant.ts#L13)

***

### processImageMessage()

> **processImageMessage**(`__namedParameters`): `Promise`\<`void`\>

#### Parameters

##### \_\_namedParameters

[`ProcessImageMessageProps`](../type-aliases/ProcessImageMessageProps.md)

#### Returns

`Promise`\<`void`\>

#### Overrides

`LangChainAssistant.processImageMessage`

#### Defined in

[llm/google.ts:108](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/google.ts#L108)

***

### processTextMessage()

> **processTextMessage**(`__namedParameters`): `Promise`\<`void`\>

Process text message

#### Parameters

##### \_\_namedParameters

[`ProcessMessageProps`](../type-aliases/ProcessMessageProps.md)

#### Returns

`Promise`\<`void`\>

#### Inherited from

`LangChainAssistant.processTextMessage`

#### Defined in

[llm/langchain.ts:161](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/langchain.ts#L161)

***

### restart()

> **restart**(): `void`

#### Returns

`void`

#### Overrides

`LangChainAssistant.restart`

#### Defined in

[llm/google.ts:55](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/google.ts#L55)

***

### stop()

> **stop**(): `void`

Stop processing

#### Returns

`void`

#### Inherited from

`LangChainAssistant.stop`

#### Defined in

[llm/langchain.ts:138](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/langchain.ts#L138)

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

`LangChainAssistant.translateVoiceToText`

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

###### maxTokens

`number`

###### model

`string`

###### temperature

`number`

###### topP

`number`

###### version

`string`

#### Returns

`void`

#### Inherited from

`LangChainAssistant.configure`

#### Defined in

[llm/langchain.ts:72](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/langchain.ts#L72)

***

### getInstance()

> `static` **getInstance**(): `Promise`\<[`GoogleAssistant`](GoogleAssistant.md)\>

#### Returns

`Promise`\<[`GoogleAssistant`](GoogleAssistant.md)\>

#### Defined in

[llm/google.ts:29](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/google.ts#L29)

***

### registerFunctionCalling()

> `static` **registerFunctionCalling**(`__namedParameters`): `void`

Register custom function for function calling

#### Parameters

##### \_\_namedParameters

[`RegisterFunctionCallingProps`](../type-aliases/RegisterFunctionCallingProps.md)

#### Returns

`void`

#### Inherited from

`LangChainAssistant.registerFunctionCalling`

#### Defined in

[llm/langchain.ts:99](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/llm/langchain.ts#L99)
