/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { findSolution } from "./core";
import { DefectiveDifference, Difference } from "./defs";
import { writeFile } from "fs/promises";
import { unknownDifferences } from "./utils";
import { promisify } from "util";
import { exec } from "child_process";
async function runCase(n: number, k: number, differences: DefectiveDifference[]) {
  for (const tree of findSolution(n, k, differences)) {
    await writeFile(
      `${n}-${k}-${differences.join("_")}.output.json`,
      JSON.stringify(
        tree,
        (_, v) => {
          if (v instanceof Set) {
            return [...v];
          }
          return v;
        },
        2
      )
    );
    break;
  }
}

(async () => {
  await promisify(exec)("npm run clear");
  await runCase(12, 3, unknownDifferences);
  await runCase(9, 2, [Difference.Lighter]);
})();
