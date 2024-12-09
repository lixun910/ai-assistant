import {
  CallbackFunctionProps,
  CustomFunctionCall,
  CustomFunctionContext,
  CustomFunctionOutputProps,
  ErrorCallbackResult,
  RegisterFunctionCallingProps,
} from '../../types';
import { Table as ArrowTable, tableFromArrays } from 'apache-arrow';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';

import * as duckdb from '@duckdb/duckdb-wasm';
import {
  Table,
  TableColumn,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Selection,
  Checkbox,
  Select,
  SelectItem,
} from '@nextui-org/react';

const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

let db: duckdb.AsyncDuckDB | null = null;

async function initDuckDB(externalDB?: duckdb.AsyncDuckDB) {
  if (externalDB) {
    db = externalDB;
    return;
  }

  if (db === null) {
    // Select a bundle based on browser checks
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);
    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker!}");`], {
        type: 'text/javascript',
      })
    );
    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();
    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  }
}

/**
 * The callback function when the user selects values.
 * @param datasetName - The name of the dataset.
 * @param columnName - The name of the column.
 * @param selectedValues - The selected values, which is an array of the key values of the selected rows. The key is one of the variable names in the dataset.
 */
type OnSelectedCallback = (
  datasetName: string,
  columnName: string,
  selectedValues: unknown[]
) => void;

/**
 * The context of the queryDuckDB function.
 * @property getValues - Get the values of a variable from the dataset.
 * @property duckDB - The duckdb instance. It's optional. If not provided, the function will initialize a new duckdb instance, and create a new table using {@link getValues}.
 * @property onSelected - The callback function can be used to sync the selections of the query result table with the original dataset. See {@link OnSelectedCallback} for more details.
 */
type QueryDuckDBFunctionContext = {
  getValues: (datasetName: string, variableName: string) => unknown[];
  duckDB?: duckdb.AsyncDuckDB;
  onSelected?: OnSelectedCallback;
};

type ValueOf<T> = T[keyof T];

/**
 * The values of the queryDuckDB function context.
 * @see {@link QueryDuckDBFunctionContext}
 */
type QueryDuckDBFunctionContextValues = ValueOf<QueryDuckDBFunctionContext>;

/**
 * Define the function to query the duckdb database. You can pass getValues() to the context for creating a new table in the duckdb database.
 * If you pass a duckDB instance to the context, the function will use the existing duckDB instance to create a new table.
 * The SQL query will be executed in the duckDB instance, and the result will be displayed in a table.
 * Users can select rows in the table, and the selections can be synced back to the original dataset using the onSelected callback.
 * For sync the selections, user can select a key variable in the dataset which also present in the query result table.
 * 
 * @param context - The context of the function. See {@link QueryDuckDBFunctionContext} for more details.
 * @param context.getValues - Get the values of a variable from the dataset.
 * @param context.duckDB - The duckdb instance. It's optional. If not provided, the function will initialize a new duckdb instance, and create a new table using {@link getValues}.
 * @param context.onSelected - The callback function can be used to sync the selections of the query result table with the original dataset. See {@link OnSelectedCallback} for more details.
 * @returns The function definition.
 */
export function queryDuckDBFunctionDefinition(
  context: CustomFunctionContext<QueryDuckDBFunctionContextValues>
): RegisterFunctionCallingProps {
  // Initialize DuckDB with external instance if provided
  initDuckDB((context as QueryDuckDBFunctionContext).duckDB);

  return {
    name: 'queryDuckDB',
    description:
      'You are a SQL (duckdb) expert. You can help to generate select query clause using the content of the dataset.',
    properties: {
      datasetName: {
        type: 'string',
        description: 'The name of the original dataset.',
      },
      variableNames: {
        type: 'array',
        description:
          'The names of the variables to include in the query. Please only use the variables that are present in the originaldataset.',
        items: {
          type: 'string',
        },
      },
      sql: {
        type: 'string',
        description:
          'The SQL query to execute. Please create proper SQL query clause based on the content of the dataset.',
      },
      dbTableName: {
        type: 'string',
        description: 'The name of the table used in the sql query.',
      },
    },
    required: ['datasetName', 'sql', 'dbTableName', 'variableNames'],
    callbackFunction: queryDuckDBCallbackFunction,
    callbackFunctionContext: context,
    callbackMessage: queryDuckDBCallbackMessage,
  };
}

type QueryDuckDBFunctionArgs = {
  datasetName: string;
  variableNames: string[];
  sql: string;
  dbTableName: string;
};

type QueryDuckDBOutputResult =
  | ErrorCallbackResult
  | {
      success?: boolean;
      details: string;
    };

type QueryDuckDBOutputData = {
  columnData: { [key: string]: unknown[] };
  variableNames: string[];
  datasetName: string;
  sql: string;
  dbTableName: string;
  onSelected?: (
    datasetName: string,
    columnName: string,
    selectedValues: unknown[]
  ) => void;
};

async function queryDuckDBCallbackFunction({
  functionName,
  functionArgs,
  functionContext,
}: CallbackFunctionProps): Promise<
  CustomFunctionOutputProps<QueryDuckDBOutputResult, QueryDuckDBOutputData>
> {
  const { datasetName, variableNames, sql, dbTableName } =
    functionArgs as QueryDuckDBFunctionArgs;
  const { getValues, onSelected } =
    functionContext as QueryDuckDBFunctionContext;

  const variableNamesWithoutRowIndex = variableNames.filter(
    (name) => name !== 'row_index'
  );
  try {
    // Get values for each variable
    const columnData = variableNamesWithoutRowIndex.reduce((acc, varName) => {
      try {
        acc[varName] = getValues(datasetName, varName);
      } catch {
        throw new Error(`variable ${varName} is not found in the dataset.`);
      }
      return acc;
    }, {});
    columnData['row_index'] = Array.from(
      { length: columnData[variableNamesWithoutRowIndex[0]].length },
      (_, i) => i
    );

    return {
      type: 'query',
      name: functionName,
      result: {
        details: `Show the sql that will be executed: ${sql}, and tell the user the result will be displayed in a table.`,
      },
      data: {
        columnData,
        variableNames,
        datasetName,
        sql,
        dbTableName,
        onSelected,
      },
    };
  } catch (error) {
    return {
      type: 'error',
      name: functionName,
      result: {
        success: false,
        details: `Can not get the values of the variables. ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
    };
  }
}

export function queryDuckDBCallbackMessage(
  props: CustomFunctionCall
): ReactNode | null {
  return (
    <div className="mt-4">
      <QueryDuckDBComponent {...props} />
    </div>
  );
}

function QueryDuckDBComponent({
  output,
}: CustomFunctionCall): ReactNode | null {
  const data = output.data as QueryDuckDBOutputData;

  // sync selections by
  const [syncSelection, setSyncSelection] = useState(false);
  const [syncSelectionBy, setSyncSelectionBy] = useState<string | null>(null);
  // selected rows
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));

  // query result
  const [queryResult, setQueryResult] = useState<unknown[]>([]);

  // error handling
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  const pages = Math.ceil(queryResult.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return queryResult.slice(start, end);
  }, [page, queryResult]);

  useEffect(() => {
    const query = async () => {
      try {
        if (db && data && data.columnData && data.dbTableName && data.sql) {
          // Create Arrow Table from column data with explicit type
          const arrowTable: ArrowTable = tableFromArrays(data.columnData);
          const conn = await db.connect();
          // drop the table if it exists
          await conn.query(`DROP TABLE IF EXISTS ${data.dbTableName}`);

          // insert the arrow table to the database
          // @ts-expect-error arrowTable is not typed
          await conn.insertArrowTable(arrowTable, { name: data.dbTableName });

          // Execute the provided SQL query
          const arrowResult = await conn.query(data.sql);

          const result = arrowResult.toArray().map((row) => row.toJSON());
          setQueryResult(result);

          // delete the table from the database
          await conn.query(`DROP TABLE ${data.dbTableName}`);

          // close the connection
          await conn.close();
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : String(error));
      }
    };
    query();
  }, []);

  const onSyncSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSyncSelection(e.target.checked);
    if (e.target.checked === false) {
      if (syncSelectionBy) {
        data?.onSelected?.(data.datasetName, syncSelectionBy, []);
      }
    }
  };

  const onSyncSelectionBy = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSyncSelectionBy(e.target.value);
  };

  useEffect(() => {
    if (syncSelection) {
      const selectedRows = Array.from(selectedKeys).map((v) =>
        parseInt(v.toString(), 10)
      );
      // get the value of the syncSelectionBy variable
      const syncSelectionByValue = syncSelectionBy
        ? data.columnData[syncSelectionBy]
        : null;
      // filter syncSelectionByValue with selectedRows
      const filteredSyncSelectionByValue = syncSelectionByValue
        ? selectedRows.map((row) => syncSelectionByValue[row])
        : null;
      // if filteredSyncSelectionByValue is not null, call the onSelected callback
      if (filteredSyncSelectionByValue && syncSelectionBy) {
        data?.onSelected?.(
          data.datasetName,
          syncSelectionBy,
          filteredSyncSelectionByValue
        );
      }
    }
  }, [selectedKeys]);

  return !db ? null : error ? (
    <div>
      <p className="text-tiny">Something went wrong with the query.</p>
      {error}
    </div>
  ) : queryResult.length > 0 ? (
    <div className="flex flex-col gap-4 max-w-full">
      <Table
        bottomContent={
          <div className="flex w-full justify-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="secondary"
              page={page}
              total={pages}
              onChange={(page) => setPage(page)}
              size="sm"
              hidden={pages <= 1}
            />
          </div>
        }
        classNames={{
          wrapper: 'max-h-[420px] max-w-full overflow-x-auto',
          base: 'overflow-scroll p-0 m-0 text-tiny',
          table: 'p-0 m-0 text-tiny',
          th: 'text-tiny',
          td: 'text-[9px]',
        }}
        isHeaderSticky
        selectedKeys={selectedKeys}
        selectionMode="multiple"
        selectionBehavior="replace"
        disallowEmptySelection={false}
        onSelectionChange={setSelectedKeys}
      >
        <TableHeader>
          {Object.keys(queryResult[0] || {}).map((key) => (
            <TableColumn key={key}>{key}</TableColumn>
          ))}
        </TableHeader>
        <TableBody>
          {items.map((row, i) => (
            <TableRow
              key={`0${(row as Record<string, unknown>)['row_index'] || i}`}
            >
              {Object.values(row as Record<string, unknown>).map((value, j) => (
                <TableCell key={j}>
                  {typeof value === 'number' && !Number.isInteger(value)
                    ? value.toFixed(3)
                    : String(value)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex flex-row gap-2">
        <Checkbox onChange={onSyncSelection}>sync selections by</Checkbox>
        <div className="flex-1">
          <Select size="sm" onChange={onSyncSelectionBy}>
            {data.variableNames.map((name) => (
              <SelectItem key={name}>{name}</SelectItem>
            ))}
          </Select>
        </div>
      </div>
    </div>
  ) : null;
}
