[**react-ai-assist**](../README.md)

***

[react-ai-assist](../globals.md) / histogramFunctionDefinition

# Function: histogramFunctionDefinition()

> **histogramFunctionDefinition**(`context`): [`RegisterFunctionCallingProps`](../type-aliases/RegisterFunctionCallingProps.md)

Define the histogram function. This function can assist user to create a histogram plot using the values of a variable in the dataset.
The values should be retrieved using the getValues() callback function.

User can select the bars in the histogram plot, and the selections can be synced back to the original dataset using the onSelected() callback.
See OnSelectedCallback for more details.

## Parameters

### context

[`CustomFunctionContext`](../type-aliases/CustomFunctionContext.md)\<`HistogramFunctionContextValues`\>

The context of the function. See HistogramFunctionContext for more details.

## Returns

[`RegisterFunctionCallingProps`](../type-aliases/RegisterFunctionCallingProps.md)

The function definition.

## Defined in

[addons/echarts/histogram.ts:53](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/addons/echarts/histogram.ts#L53)
