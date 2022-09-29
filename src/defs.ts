/**
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * TODO
 * 追求性能的场景，需将枚举值换为数字，目前使用字面量方便debug
 */

/**
 * 差别
 */
export enum Difference {
  Lighter = "lighter",
  Normal = "normal",
  Heavier = "heavier",
}

export type DefectiveDifference = Difference.Lighter | Difference.Heavier;

export enum WeighResult {
  /**
   * 代表左边轻
   */
  Left = "left",
  Balance = "balance",
  /**
   * 代表右边轻
   */
  Right = "right",
}

export type Product = number;

export type Case = [bad: Product, d: DefectiveDifference];

export type Sequence = Product[];

export type Strategy = [Lefts: Set<Product>, Rights: Set<Product>];

export enum NodeType {
  Strategy = "strategy",
  Conclusion = "conclusion",
}

export type StrategyNode = {
  type: NodeType.Strategy;
  strategy: Strategy;
  cases: Case[];
  children: Record<WeighResult, TreeNode | null>;
};

export type ConclusionNode = {
  type: NodeType.Conclusion;
  enumerated: Case;
};

export type TreeNode = StrategyNode | ConclusionNode;

