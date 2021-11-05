import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";
import {
  JsQuery,
  RestQuery,
  TButton,
  TDebug,
  TInput,
  TProvider,
  TSelect,
  TTable,
  TText,
} from "./components/Components";

const defaultTableData = [
  {
    id: 1,
    name: "Hanson Deck",
    email: "hanson@deck.com",
    sales: 37,
  },
  {
    id: 2,
    name: "Sue Shei",
    email: "sueshei@example.com",
    sales: 550,
    salez: 550,
  },
  {
    id: 3,
    name: "Jason Response",
    email: "jason@response.com",
    sales: 55,
  },
  {
    id: 4,
    name: "Cher Actor",
    email: "cher@example.com",
    sales: 424,
  },
  {
    id: 5,
    name: "Erica Widget",
    email: "erica@widget.org",
    sales: 243,
  },
];

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "ipiFgUAjbhn4dGzqCoDZAY",
      token:
        "tSlFga3O93isiTX2kd0MeoVbwRNjQNyH4bNL9DxqBOfUktopYAWwb5p5RgxoSk79ylm7oF61iStgQ32RW2oQ",
    },
  ],
});

PLASMIC.registerComponent(TProvider, {
  name: "Provider",
  props: {
    debug: "boolean",
    defaultEnv: {
      type: "object",
      defaultValue: { meaningOfLife: 42 },
    },
    children: "slot",
  },
});

PLASMIC.registerComponent(TButton, {
  name: "Button",
  props: {
    clickAction: {
      type: "string",
      defaultValue: `[]`,
    },
    children: "slot",
  },
});

PLASMIC.registerComponent(TText, {
  name: "Text",
  props: {
    textExpr: {
      type: "string",
      defaultValue: `"This is some text to display."`,
    },
  },
});

PLASMIC.registerComponent(TInput, {
  name: "Input",
  props: {
    name: "string",
    multiline: "boolean",
    labelExpr: {
      type: "string",
      defaultValue: `"My input"`,
    },
    defaultValueExpr: "string",
    rows: "number",
  },
});

PLASMIC.registerComponent(TTable, {
  name: "Table",
  props: {
    name: "string",
    onSelectRowAction: "string",
    columnSpecsExpr: "string",
    rowsPerPage: {
      type: "number",
      defaultValue: 10,
    },
    dataExpr: {
      type: "string",
      defaultValue: JSON.stringify(defaultTableData),
    },
  },
});

PLASMIC.registerComponent(TSelect, {
  name: "Select",
  props: {
    name: "string",
    optionsExpr: {
      type: "string",
      defaultValue: `["first","second","third"]`,
    },
    defaultValueExpr: "string",
    labelExpr: {
      type: "string",
      defaultValue: `"My select"`,
    },
  },
});

PLASMIC.registerComponent(RestQuery, {
  name: "RestQuery",
  displayName: "REST Query",
  props: {
    name: "string",
    urlExpr: {
      type: "string",
      defaultValue: `"http://localhost:3000/api/fetch?path=/api/v1/admin/users"`,
    },
    bodyExpr: "string",
    disableExpr: "string",
    method: {
      type: "choice",
      defaultValue: "GET",
      options: ["GET", "POST"],
    },
    runWhen: {
      type: "choice",
      options: ["always", "triggered"],
    },
  },
});

PLASMIC.registerComponent(JsQuery, {
  name: "JsQuery",
  displayName: "Javascript Query",
  props: {
    name: "string",
    jsExpr: "string",
  },
});

PLASMIC.registerComponent(TDebug, {
  name: "DebugPanel",
  props: {},
});
