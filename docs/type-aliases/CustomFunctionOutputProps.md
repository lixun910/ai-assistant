[**react-ai-assist**](../README.md)

***

[react-ai-assist](../globals.md) / CustomFunctionOutputProps

# Type Alias: CustomFunctionOutputProps\<R, D\>

> **CustomFunctionOutputProps**\<`R`, `D`\>: `object`

Type of Custom function output props

## Type Parameters

• **R**

The type of the result send back to LLM

• **D**

The type of the data used by custom message callback

## Type declaration

### args?

> `optional` **args**: `Record`\<`string`, `unknown`\>

### customMessageCallback?

> `optional` **customMessageCallback**: [`CustomMessageCallback`](CustomMessageCallback.md)

### data?

> `optional` **data**: `D`

### isIntermediate?

> `optional` **isIntermediate**: `boolean`

### name

> **name**: `string`

### result

> **result**: `R`

### type

> **type**: `string`

## Param

The type of the function, e.g. 'custom' used for type guarding

## Param

The name of the function, e.g. createMap, createPlot etc.

## Param

The args of the function, e.g. {datasetId: '123', variable: 'income'}

## Param

The flag indicate if the custom function is a intermediate step

## Param

The result of the function run, it will be sent back to LLM as response of function calling

## Param

The data of the function run, it will be used by customMessageCallback() to create the custom message e.g. plot, map etc.

## Param

The callback function to create custom message e.g. plot/map if needed

## Defined in

[types.ts:91](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/types.ts#L91)
