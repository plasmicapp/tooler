import { initPlasmicLoader } from "@plasmicapp/loader-nextjs";
import { TButton, TTable, TText } from "./components/Components";

export const PLASMIC = initPlasmicLoader({
  projects: [
    {
      id: "ipiFgUAjbhn4dGzqCoDZAY",
      token:
        "tSlFga3O93isiTX2kd0MeoVbwRNjQNyH4bNL9DxqBOfUktopYAWwb5p5RgxoSk79ylm7oF61iStgQ32RW2oQ",
    },
  ],
});

PLASMIC.registerComponent(TButton, {
  name: "Button",
  props: {
    onClick: "string",
    children: "slot",
  },
});

PLASMIC.registerComponent(TText, {
  name: "Text",
  props: {
    textExpr: "string",
  },
});

PLASMIC.registerComponent(TTable, {
  name: "Table",
  props: {
    onSelectRow: "string",
    dataExpr: "string",
    children: "slot",
  },
});
