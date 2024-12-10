[**react-ai-assist**](../README.md)

***

[react-ai-assist](../globals.md) / ProcessMessageProps

# Type Alias: ProcessMessageProps

> **ProcessMessageProps**: `object`

Type of ProcessMessageProps

## Type declaration

### imageMessage?

> `optional` **imageMessage**: `string`

### message?

> `optional` **message**: `string`

### streamMessageCallback

> **streamMessageCallback**: [`StreamMessageCallback`](StreamMessageCallback.md)

### textMessage?

> `optional` **textMessage**: `string`

### userActions?

> `optional` **userActions**: [`UserActionProps`](UserActionProps.md)[]

### useTool?

> `optional` **useTool**: `boolean`

## Param

The text message to be processed.

## Param

The image message to be processed.

## Param

The user actions to be processed.

## Param

The stream message callback to stream the message back to the UI.

## Param

The flag to indicate if the tool is used.

## Param

The message to be processed.

## Defined in

[types.ts:210](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/types.ts#L210)
