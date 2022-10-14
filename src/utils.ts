/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import {
  Case,
  ConclusionNode,
  DefectiveDifference,
  Difference,
  NodeType,
  Product,
  Strategy,
  StrategyNode,
  TreeNode,
  WeighResult,
} from "./defs";

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
  return Array.from({ length: n }, (_, i) => i + 1);
}

export const unknownDifferences: DefectiveDifference[] = [Difference.Heavier, Difference.Lighter];

export function cases(products: Product[], differences: DefectiveDifference[] = unknownDifferences) {
  return products.flatMap((bad) => differences.map<Case>((d) => [bad, d]));
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

type NullNode = { type: null } & HasParent;

type HasParent = {
  parent?: ConnectedTreeNode;
};

type ConnectedStrategyNodeChildren = {
  children: Record<WeighResult, ConnectedTreeNode | NullNode>;
};

export type ConnectedTreeNode =
  | ((ConclusionNode | (Omit<StrategyNode, "children"> & ConnectedStrategyNodeChildren)) & HasParent)
  | NullNode;
export function connectParent(root: TreeNode): ConnectedTreeNode {
  const results = [WeighResult.Left, WeighResult.Balance, WeighResult.Right];
  function dfs(node: TreeNode, parent?: TreeNode, connectedParent?: ConnectedTreeNode): ConnectedTreeNode {
    if (node.type === NodeType.Conclusion) {
      return {
        ...node,
        parent: connectedParent,
      };
    }
    const { children, ...withoutChildren } = node;
    // @ts-expect-error later updated type
    const laterUpdatedChildren: ConnectedStrategyNodeChildren["children"] = {};
    const withParent: ConnectedTreeNode = {
      ...withoutChildren,
      children: laterUpdatedChildren,
      parent: connectedParent,
    };
    for (const w of results) {
      const child = node.children[w];
      if (child) {
        withParent.children[w] = dfs(child, node, withParent);
      } else {
        withParent.children[w] = { type: null, parent: withParent };
      }
    }
    return withParent;
  }
  return dfs(root);
}
