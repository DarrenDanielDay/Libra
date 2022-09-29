/**
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Case, DefectiveDifference, Difference, NodeType, Product, Strategy, TreeNode, WeighResult } from "./defs";

export function lean(d: Difference): WeighResult {
  return d === Difference.Lighter ? WeighResult.Left : WeighResult.Right;
}

export function inverse(w: WeighResult): WeighResult {
  switch (w) {
    case WeighResult.Left:
      return WeighResult.Right;
    case WeighResult.Right:
      return WeighResult.Left;
    default:
      return WeighResult.Balance;
  }
}

export function products(n: number): Product[] {
  return Array.from({ length: n }, (_, i) => i);
}

export const unknownDifferences: DefectiveDifference[] = [Difference.Heavier, Difference.Lighter];

export function cases(n: number, differences: DefectiveDifference[] = unknownDifferences) {
  return products(n).flatMap((bad) => differences.map<Case>((d) => [bad, d]));
}

export function weigh(enumerated: Case, strategy: Strategy): WeighResult {
  const [bad, d] = enumerated;
  const [Lefts, Rights] = strategy;
  if (Lefts.has(bad)) {
    return lean(d);
  }
  if (Rights.has(bad)) {
    return inverse(lean(d));
  }
  return WeighResult.Balance;
}

export function TestTree(enumerated: Case, root: TreeNode): boolean {
  let node = root;
  while (node.type !== NodeType.Conclusion) {
    const w = weigh(enumerated, node.strategy);
    const next = node.children[w];
    if (!next) {
      console.debug("Conclusion is not available for case:", enumerated);
      return false;
    }
    node = next;
  }
  const result = node.enumerated[0] === enumerated[0] && node.enumerated[1] === enumerated[1];
  if (!result) {
    console.log("expect:", enumerated);
    console.log("actual:", node.enumerated);
  }
  return result;
}
