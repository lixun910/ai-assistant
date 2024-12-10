[**react-ai-assist**](../README.md)

***

[react-ai-assist](../globals.md) / queryDuckDBFunctionDefinition

# Function: queryDuckDBFunctionDefinition()

> **queryDuckDBFunctionDefinition**(`context`): [`RegisterFunctionCallingProps`](../type-aliases/RegisterFunctionCallingProps.md)

Define the function to query the duckdb database. You can pass getValues() to the context for creating a new table in the duckdb database.
If you pass a duckDB instance to the context, the function will use the existing duckDB instance to create a new table.
The SQL query will be executed in the duckDB instance, and the result will be displayed in a table.
Users can select rows in the table, and the selections can be synced back to the original dataset using the onSelected callback.
For sync the selections, user can select a key variable in the dataset which also present in the query result table.

## Parameters

### context

[`CustomFunctionContext`](../type-aliases/CustomFunctionContext.md)\<`QueryDuckDBFunctionContextValues`\>

The context of the function. See QueryDuckDBFunctionContext for more details.

## Returns

[`RegisterFunctionCallingProps`](../type-aliases/RegisterFunctionCallingProps.md)

The function definition.

## Defined in

[addons/duckdb/query.tsx:97](https://github.com/lixun910/ai-assistant/blob/3d3b9b0ad83cd6e8a6fa140c45b5cd7a1afa7cb8/src/addons/duckdb/query.tsx#L97)
