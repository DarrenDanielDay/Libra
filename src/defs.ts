/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

type EnumType<T> = T[keyof T];
/**
 * 差别
 */
export const Difference = {
  Lighter: -1,
  Normal: 0,
  Heavier: 1,
} as const;
export type Difference = EnumType<typeof Difference>;

export type DefectiveDifference = typeof Difference.Lighter | typeof Difference.Heavier;

export const WeighResult = {
  /**
   * 代表左边轻
   */
  Left: -1,
  Balance: 0,
  /**
   * 代表右边轻
   */
  Right: 1,
} as const;
export type WeighResult = EnumType<typeof WeighResult>;
export type Product = number;

export type Case = [bad: Product, d: DefectiveDifference];

export type Sequence = Product[];

export type Strategy = [Lefts: Set<Product>, Rights: Set<Product>];

export const NodeType = {
  Strategy: 1,
  Conclusion: 0,
} as const;
export type NodeType = EnumType<typeof NodeType>;

export type StrategyNode = {
  type: typeof NodeType.Strategy;
  strategy: Strategy;
  cases: Case[];
  children: Record<WeighResult, TreeNode | null>;
};

export type ConclusionNode = {
  type: typeof NodeType.Conclusion;
  enumerated: Case;
};

export type TreeNode = StrategyNode | ConclusionNode;
