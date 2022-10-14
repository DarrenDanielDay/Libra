/**
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @ts-check
import * as esbuild from "esbuild";
import { readFile } from "fs/promises";
const isDev = process.argv.includes("--dev");
await esbuild.build({
  entryPoints: ["./demo/index.tsx"],
  plugins: [
    {
      name: "inject-import-alias",
      setup(build) {
        build.onLoad({ filter: /.tsx$/ }, async ({ path }) => {
          const script = await readFile(path, { encoding: "utf-8" });
          return {
            loader: "tsx",
            contents: `import{createElement as h,Fragment as f}from"react";${script}`,
          };
        });
      },
    },
  ],
  jsxFactory: "h",
  jsxFragment: "f",
  bundle: true,
  sourcemap: true,
  watch: isDev,
  minify: !isDev,
  format: "esm",
  external: ["react", "react-dom", "*.json"],
  outfile: "./demo/index.js",
});
