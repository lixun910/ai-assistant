[**react-ai-assist**](../README.md)

***

[react-ai-assist](../globals.md) / useAssistant

# Function: useAssistant()

> **useAssistant**(`props`): `object`

A custom hook for managing an AI assistant.
This hook provides functionality to initialize, send messages to, and control an AI assistant.

## Parameters

### props

`UseAssistantProps`

Configuration options for the assistant.

## Returns

`object`

An object containing methods to interact with the assistant and its current status.

### addAdditionalContext()

> **addAdditionalContext**: (`params`) => `Promise`\<`void`\>

Adds additional context to the assistant's conversation.

#### Parameters

##### params

The context and optional callback.

###### callback

() => `void`

###### context

`string`

#### Returns

`Promise`\<`void`\>

### apiKeyStatus

> **apiKeyStatus**: `string`

### audioToText()

> **audioToText**: (`audioBlob`) => `Promise`\<`undefined` \| `string`\>

Converts audio to text using the assistant's capabilities.

#### Parameters

##### audioBlob

`Blob`

The audio data to be converted.

#### Returns

`Promise`\<`undefined` \| `string`\>

The transcribed text.

### initializeAssistant()

> **initializeAssistant**: () => `Promise`\<`void`\>

Initializes the AI assistant with the provided configuration.

#### Returns

`Promise`\<`void`\>

### restartChat()

> **restartChat**: () => `Promise`\<`void`\>

Restarts the chat by stopping the current chat and reinitializing the assistant.

#### Returns

`Promise`\<`void`\>

### sendImageMessage()

> **sendImageMessage**: (`props`) => `Promise`\<`void`\>

Sends an image message to the assistant and processes the response.

#### Parameters

##### props

`SendImageMessageProps`

The image data, message, and callback for streaming the response.

#### Returns

`Promise`\<`void`\>

### sendTextMessage()

> **sendTextMessage**: (`props`) => `Promise`\<`void`\>

Sends a text message to the assistant and processes the response.

#### Parameters

##### props

`SendTextMessageProps`

The message and callback for streaming the response.

#### Returns

`Promise`\<`void`\>

### stopChat()

> **stopChat**: () => `void`

Stops the current chat processing.

#### Returns

`void`

## Defined in

[hooks/use-assistant.ts:98](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/hooks/use-assistant.ts#L98)
