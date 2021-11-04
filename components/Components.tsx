import Inspector from "react-inspector";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import _ from "lodash";
import {
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  TextField,
} from "@mui/material";
import { Box } from "@mui/system";
import { visuallyHidden } from "@mui/utils";
import { PlasmicCanvasContext } from "@plasmicapp/host";
import { useForceUpdate } from "@plasmicapp/loader-react/dist/utils";

type HttpMethod = "GET" | "POST";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export function ensure<T>(x: T | null | undefined, msg = ""): T {
  if (x === null || x === undefined) {
    debugger;
    throw new Error(
      `Value must not be undefined or null${msg ? `- ${msg}` : ""}`
    );
  } else {
    return x;
  }
}

export type Expr = string;

export type Action = string;

type Env = Record<string, any>;

/**
 * Returns a function that takes in a sandbox scope object (which contains
 * only variables accessible to the code), and an optional "this" object
 * (which defaults to empty object), and evaluates `src` in that context.
 *
 * Based on
 * https://blog.risingstack.com/writing-a-javascript-framework-sandboxed-code-evaluation/
 * with additions on binding `this`.
 *
 * Note that this is NOT SECURE; it simply prevents unintentionally leaking
 * in globals.  Globals are very much still ACCESSIBLE!  For example,
 * you can get to the global Object just by evaluating `({}).constructor`.
 */
function compileCodeExpr(src: string) {
  const code = new Function("sandbox", `with (sandbox) { return ${src}; }`);

  return function (sandbox: object, thisObj?: object) {
    const sandboxProxy = new Proxy(sandbox, {
      has: (target: any, key: PropertyKey) => true,
      get: (target: any, key: PropertyKey, receiver: any) => {
        if (key === Symbol.unscopables) {
          return undefined;
        } else {
          return target[key];
        }
      },
    });
    const res = code.bind(thisObj ?? {})(sandboxProxy);
    return res;
  };
}

export function evalExprInSandbox(
  code: string,
  sandbox: object,
  thisObj?: object
) {
  return compileCodeExpr(code)(sandbox, thisObj);
}

class Store {
  constructor(
    public readonly debug: boolean,
    private env: Env,
    private forceUpdate: () => void
  ) {}
  getEnv() {
    return { ...this.env };
  }
  evalExpr(expr: Expr) {
    return evalExprInSandbox("(" + expr + ")", { JSON, ...this.env });
  }
  evalExprWithDefault<T>(expr: Expr | undefined, defaultValue: T): T {
    return expr !== undefined
      ? this.evalExpr(expr) ?? defaultValue
      : defaultValue;
  }
  async execAction(action: Action) {
    const steps = JSON.parse(action);
    for (const { query } of steps) {
      await this.registeredQueries[query]();
      this.forceUpdate();
    }
  }
  makeEventHandler(action?: Action) {
    return action ? (...args: any[]) => this.execAction(action) : undefined;
  }
  updateState(name: string | undefined, value: any) {
    if (name) {
      this.env[name] = value;
      console.log("force updating");
      this.forceUpdate();
    }
  }
  dumpDebug() {
    return Object.keys(this.env)
      .map((name) => `${name}: ${this.dumpDebugName(name)}`)
      .join("\n");
  }
  dumpDebugName(name: string) {
    return JSON.stringify(this.env[name], null, 2)?.slice(0, 999);
  }
  async execRestQuery({
    name,
    url,
    method,
    body,
  }: {
    name: string;
    url: string;
    method: HttpMethod;
    body?: any;
  }) {
    this.updateState(name, { state: "loading" });
    try {
      const response = await fetch(
        url +
          "&body=" +
          encodeURIComponent(method === "GET" ? "" : JSON.stringify(body)),
        {
          method,
        }
      );
      const status = response.status;
      const result = await response.json();
      this.updateState(name, { state: "done", status, value: result });
    } catch (error) {
      this.updateState(name, {
        state: "error",
        errorMessage: (error as any).message,
        error,
      });
    }
  }
  async execJsQuery({ name, js }: { name: string; js: string }) {
    this.updateState(name, { state: "running" });
    try {
      const f = new AsyncFunction(js);
      const result = await f();
      this.updateState(name, { state: "done", value: result });
    } catch (error) {
      this.updateState(name, {
        state: "error",
        errorMessage: (error as any).message,
        error,
      });
    }
  }
  private registeredQueries: Record<string, () => Promise<void>> = {};
  registerQuery(name: string, run: () => Promise<void>) {
    this.registeredQueries[name] = run;
  }
  async execNamedQuery(name: string) {
    return this.registeredQueries[name]();
  }
}

export const StoreContext = createContext<[Store] | undefined>(undefined);

export const useStore = () => ensure(useContext(StoreContext))[0];

export interface TProviderProps {
  children?: ReactNode;
  defaultEnv?: Env;
  debug?: boolean;
}

export function TProvider({
  children,
  defaultEnv = {},
  debug = false,
}: TProviderProps) {
  const [, setCount] = useState(0);
  // const store = new Store(debug, defaultEnv, () =>
  //   setCount((count) => count + 1)
  // );

  const [store] = useState(
    new Store(debug, defaultEnv, () => setCount((count) => count + 1))
  );
  return (
    <StoreContext.Provider value={[store]}>{children}</StoreContext.Provider>
  );
}

export interface TButtonProps {
  children?: ReactNode;
  className?: string;
  onClickAction?: Action;
}

export function TButton({ children, className, onClickAction }: TButtonProps) {
  const store = useStore();
  return (
    <Button
      className={className}
      onClick={store.makeEventHandler(onClickAction)}
    >
      <div>{children}</div>
    </Button>
  );
}

export interface TTextProps {
  className?: string;
  textExpr?: Expr;
}

export function TText({ className, textExpr }: TTextProps) {
  const store = useStore();
  return (
    <div className={className}>{store.evalExprWithDefault(textExpr, "")}</div>
  );
}

export interface TInputProps {
  className?: string;
  name?: string;
  defaultValueExpr?: Expr;
  placeholderExpr?: Expr;
  labelExpr?: Expr;
  multiline?: boolean;
  rowsExpr?: Expr;
}

export function TInput({
  className,
  name,
  defaultValueExpr,
  placeholderExpr,
  labelExpr,
  multiline = false,
  rowsExpr,
}: TInputProps) {
  const store = useStore();
  const defaultValue = store.evalExprWithDefault(defaultValueExpr, "");
  useEffect(() => {
    store.updateState(name, { value: defaultValue });
  }, [name, defaultValue]);
  const [value, setValue] = useState(defaultValue);
  const placeholder = store.evalExprWithDefault(placeholderExpr, "");
  const debounced = _.debounce((f: () => void) => f(), 200);
  const label = store.evalExprWithDefault(labelExpr, "");
  const rows = store.evalExprWithDefault(rowsExpr, 3);
  return (
    <TextField
      className={className}
      label={label}
      value={value}
      multiline={multiline}
      rows={rows}
      onChange={(e) => {
        setValue(e.target.value);
        debounced(() => store.updateState(name, { value: e.target.value }));
      }}
    />
  );
}

export interface TSelectProps {
  className?: string;
  name?: string;
  defaultValueExpr?: Expr;
  labelExpr?: Expr;
  optionsExpr?: Expr;
}

export function TSelect({
  name,
  className,
  defaultValueExpr,
  labelExpr,
  optionsExpr,
}: TSelectProps) {
  const store = useStore();
  const [value, setValue] = React.useState<undefined | string>();
  useEffect(() => {
    store.updateState(name, {
      value,
    });
  }, [name, value]);
  const options = store.evalExprWithDefault<string[]>(optionsExpr, []);
  const label = store.evalExprWithDefault(labelExpr, "");
  const defaultValue = store.evalExprWithDefault(defaultValueExpr, "");
  return (
    <Autocomplete
      disablePortal
      options={options}
      className={className}
      defaultValue={defaultValue}
      onChange={(event, newValue) => {
        setValue(newValue === null ? undefined : newValue);
      }}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

export interface TTableProps {
  name?: string;
  className?: string;
  onSelectRowAction?: Action;
  dataExpr?: Expr;
  columnSpecsExpr?: Expr;
  rowsPerPage?: number;
}

type RowsData = Record<string, string>[];

type Type = "string" | "number" | "boolean" | "any";

interface ColumnSpec {
  type?: Type;
  hidden?: boolean;
}

function vectorize(rows: RowsData) {
  const columns: Record<string, any[]> = {};
  for (const row of rows) {
    for (const [name, value] of Object.entries(row)) {
      if (!columns[name]) {
        columns[name] = [];
      }
      columns[name].push(value);
    }
  }
  return columns;
}

// const rankedTypes = ['boolean','number','string'];
//
// function inferType(values: any[]): Type {
//   return values.some(value => _.isNumber(value) ? 'number')
// }

function inferColumns(data: RowsData): Record<string, ColumnSpec> {
  const vectorized = vectorize(data);
  return Object.fromEntries(
    Object.entries(vectorized).map(([name, values]): [string, ColumnSpec] => {
      return [
        name,
        {
          type: "any",
        },
      ];
    })
  );
}

export function TTable({
  name,
  className,
  onSelectRowAction,
  dataExpr,
  columnSpecsExpr,
  rowsPerPage = 20,
}: TTableProps) {
  const store = useStore();
  const [orderBy, setOrderBy] = useState<string | undefined>(undefined);
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const rowsData: RowsData = store.evalExprWithDefault<RowsData>(dataExpr, []);
  const inferredColumns = inferColumns(rowsData);
  const sortedRowsData = orderBy
    ? _.sortBy(rowsData, (row) => row[orderBy])
    : rowsData;
  const reversedRowsData =
    orderBy && order === "desc" ? sortedRowsData.reverse() : rowsData;
  const finalRowsData = reversedRowsData;
  const [selectedRow, setSelectedRow] = useState<number | undefined>(undefined);
  useEffect(() => {
    store.updateState(name, { selectedRow });
  }, [name, selectedRow]);
  const actualColumns: Record<string, ColumnSpec> = Object.fromEntries(
    Object.entries({
      ...inferredColumns,
      ...store.evalExprWithDefault<Record<string, ColumnSpec>>(
        columnSpecsExpr,
        {}
      ),
    }).filter(([name, spec]) => !spec.hidden)
  );
  const [page, setPage] = React.useState(0);
  return (
    <Paper className={className}>
      <TableContainer component={Paper}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {Object.entries(actualColumns).map(([name, column]) => (
                <TableCell
                  key={name}
                  sortDirection={orderBy === name ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === name}
                    direction={orderBy === name ? order : "asc"}
                    onClick={() => {
                      if (orderBy === name) {
                        setOrder(order === "asc" ? "desc" : "asc");
                      } else {
                        setOrderBy(name);
                        setOrder("asc");
                      }
                    }}
                  >
                    {name}
                    {orderBy === name ? (
                      <Box component="span" sx={visuallyHidden}>
                        {order === "desc"
                          ? "sorted descending"
                          : "sorted ascending"}
                      </Box>
                    ) : null}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {finalRowsData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, rowNum) => (
                <TableRow
                  key={rowNum}
                  hover
                  role="checkbox"
                  aria-checked={selectedRow === rowNum}
                  tabIndex={-1}
                  selected={selectedRow === rowNum}
                  onClick={() => {
                    setSelectedRow(rowNum);
                    store.makeEventHandler(onSelectRowAction)?.(rowNum);
                  }}
                >
                  {Object.entries(actualColumns).map(([name, column]) => (
                    <TableCell key={name}>
                      {JSON.stringify(row[name])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        // rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={finalRowsData.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(event, page) => setPage(page)}
        // onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
}

export function TDebug({ className }: { className?: string }) {
  const store = useStore();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(true);
  });
  return (
    <div className={className}>
      {loaded && <Inspector data={store.getEnv()} expandLevel={2} />}
    </div>
  );
}

interface QueryDisplayProps {
  className?: string;
  children?: ReactNode;
}

function QueryDisplay({ className, children }: QueryDisplayProps) {
  const store = useStore();
  const inEditor = useContext(PlasmicCanvasContext);
  return inEditor || store.debug ? (
    <pre className={className} style={{ padding: "20px", background: "#eee" }}>
      {children}
    </pre>
  ) : null;
}

type RunWhen = "triggered" | "always";

export interface RestQueryProps {
  className?: string;
  name?: string;
  urlExpr?: Expr;
  method?: HttpMethod;
  bodyExpr?: Expr;
  disableExpr?: Expr;
  runWhen?: RunWhen;
}

export function RestQuery({
  className,
  name,
  urlExpr,
  bodyExpr,
  disableExpr,
  method = "GET",
  runWhen = method === "GET" ? "always" : "triggered",
}: RestQueryProps) {
  const store = useStore();
  const url = store.evalExprWithDefault(urlExpr, "");
  const body = store.evalExprWithDefault(bodyExpr, {});
  const disable = store.evalExprWithDefault(disableExpr, false);
  useEffect(() => {
    console.log("BLAH", name);
  }, [name, url, method, JSON.stringify(body), runWhen]);
  async function run() {
    if (name && url && !disable) {
      await store.execRestQuery({ name, url, method, body });
    }
  }
  useEffect(() => {
    console.log("EFFECT", name);
    if (name && url && !disable) {
      if (runWhen === "always") {
        run();
      } else {
        store.registerQuery(name, run);
        console.log("REGISTERING", name, (store as any).registeredQueries);
      }
    }
  }, [name, url, method, JSON.stringify(body), runWhen]);
  return (
    <QueryDisplay className={className}>
      REST API query: {url}
      <br />
      Method: {method}
      <br />
      Body: {bodyExpr} {JSON.stringify(body, null, 2)}
      <br />
      {name && store.dumpDebugName(name)}
    </QueryDisplay>
  );
}

export interface JsQueryProps {
  className?: string;
  name?: string;
  jsExpr?: Expr;
}

export function JsQuery({ className, name, jsExpr }: JsQueryProps) {
  const store = useStore();
  const js = store.evalExprWithDefault(jsExpr, "");
  useEffect(() => {
    if (name && js) {
      store.execJsQuery({ name, js });
    }
  }, [name, js]);
  return (
    <QueryDisplay className={className}>Javascript query: {js}</QueryDisplay>
  );
}
