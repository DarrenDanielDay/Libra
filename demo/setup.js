/// <reference path="../node_modules/es-modularize/dist/index.d.ts" />
// @ts-check
const query = new URL(location.href);
const cdnRoot = query.searchParams.get("cdn");
const registry = query.searchParams.get("regostry");
const react = ESModularize.load("https://unpkg.com/react@18.2.0/umd/react.production.min.js").sync().umd("React");
const reactDOM = ESModularize.load("https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js")
  .sync()
  .umd("ReactDOM");
if (!react || !reactDOM) {
  throw 0;
}
/**
const importMap = ESModularize.createProjectLoader({
  cdnRoot: cdnRoot ? decodeURIComponent(cdnRoot) : undefined,
  registry: registry ? decodeURIComponent(registry) : undefined,
  nodeGlobals: {
    process: {
      env: {
        NODE_ENV: "development",
      },
    },
  },
}).load(
  {
    react: "18.2.0",
    "react-dom": "18.2.0",
  },
  ["react", "react-dom/client"]
);
*/
const importMap = {
  imports: {
    react: react,
    "react-dom/client": reactDOM,
  },
};
ESModularize.build(importMap);
