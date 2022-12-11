/**
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @ts-check
import * as esbuild from "esbuild";
const isDev = process.argv.includes("--dev");
/** @type {esbuild.BuildOptions} */
const sharedConfig = {
  entryPoints: ["./demo/hyplate-example/index.tsx"],
  tsconfig: "./demo/hyplate-example/tsconfig.json",
  bundle: true,
  sourcemap: true,
  watch: isDev,
  minify: !isDev,
  platform: isDev ? "node" : "browser",
  define: isDev
    ? {
        "process.env.NODE_ENV": '"development"',
      }
    : undefined,
  format: "esm",
  external: ["*.json"],
  outdir: "./demo/hyplate-example",
};
// build setup script & index with import map
const setUpIndex = esbuild.build(sharedConfig);

await Promise.all([setUpIndex]);
