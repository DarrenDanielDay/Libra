/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { Difference, NodeType, Product, TreeNode, Strategy, Case, WeighResult, DefectiveDifference } from "./defs.js";
import { cases, products, weigh } from "./utils.js";

export function* findSolution(n: number, k: number, diffectiveDifferences: DefectiveDifference[]): Generator<TreeNode> {
  const allProducts = products(n);
  function* generateFor(restCases: Case[], restK: number): Generator<TreeNode> {
    const aggregatedCases = aggregateCases(restCases);
    const { length } = restCases;
    if (length === 0) {
      return;
    }
    if (length === 1) {
      const [[bad, difference]] = restCases;
      if (bad == null || difference == null) {
        throw new Error("Impossible");
      }
      yield {
        type: NodeType.Conclusion,
        enumerated: [bad, difference],
      };
      return;
    }
    if (restK === 0) {
      return;
    }
    if (restCases.length > 3 ** restK) {
      return;
    }
    const nextK = restK - 1;
    const maxCaseCoverCount = 3 ** nextK;
    const possibleLighter: Product[] = [];
    const possibleHeavier: Product[] = [];
    const unWeighed: Product[] = [];
    const pendingQualified = new Set(allProducts);
    for (const [product, difference] of aggregatedCases) {
      switch (difference) {
        case Difference.Lighter:
          possibleLighter.push(product);
          break;
        case Difference.Heavier:
          possibleHeavier.push(product);
          break;
        default:
          unWeighed.push(product);
          break;
      }
      pendingQualified.delete(product);
    }
    const qualified = [...pendingQualified];
    const lighterCount = possibleLighter.length;
    const heavierCount = possibleHeavier.length;
    const unWeighedCount = unWeighed.length;
    const qualifiedCount = qualified.length;
    // ?????????????????????????????????????????????n - 2????????????????????????2???????????????????????????
    const maxAsideCount = n - 2;
    // ????????????????????????????????????2???????????????????????????????????????
    const minAsideCount = n % 2;
    for (let asideCount = maxAsideCount; asideCount >= minAsideCount; asideCount -= 2) {
      const groupCount = (n - asideCount) / 2;
      for (const [ll, lh, lu, lq] of breakInto<[number, number, number, number]>(
        groupCount,
        [0, 0, 0, 0],
        [lighterCount, heavierCount, unWeighedCount, qualifiedCount],
        0
      )) {
        for (const [rl, rh, ru, rq] of breakInto<[number, number, number, number]>(
          groupCount,
          [0, 0, 0, 0],
          [lighterCount - ll, heavierCount - lh, unWeighedCount - lu, qualifiedCount - lq],
          0
        )) {
          const Lefts = new Set<Product>([
            ...possibleLighter.slice(0, ll),
            ...possibleHeavier.slice(0, lh),
            ...unWeighed.slice(0, lu),
            ...qualified.slice(0, lq),
          ]);
          const Rights = new Set<Product>([
            ...possibleLighter.slice(ll, ll + rl),
            ...possibleHeavier.slice(lh, lh + rh),
            ...unWeighed.slice(lu, lu + ru),
            ...qualified.slice(lq, lq + rq),
          ]);
          const strategy: Strategy = [Lefts, Rights];
          const leftResults: Case[] = [];
          const rightResults: Case[] = [];
          const balanceResults: Case[] = [];
          for (const possibleCase of restCases) {
            switch (weigh(possibleCase, strategy)) {
              case WeighResult.Balance:
                balanceResults.push(possibleCase);
                break;
              case WeighResult.Left:
                leftResults.push(possibleCase);
                break;
              case WeighResult.Right:
                rightResults.push(possibleCase);
                break;
              default:
                break;
            }
          }
          if ([leftResults, rightResults, balanceResults].some((results) => results.length > maxCaseCoverCount)) {
            // ?????????????????????????????????????????????`3 ^ (k - 1)`???????????????????????????????????????????????????
            continue;
          }
          const lefts = (function* () {
            if (!leftResults.length) {
              // ????????????case???????????????????????????
              yield null;
              return;
            }
            const newQualified = [...qualified];
            // ????????????
            // ???????????????????????????????????????????????????????????????????????????????????????????????????
            // ????????????????????????????????????
            // ??????????????????????????????
            for (const left of Lefts) {
              if (aggregatedCases.get(left) === Difference.Heavier) {
                newQualified.push(left);
              }
            }
            for (const right of Rights) {
              if (aggregatedCases.get(right) === Difference.Lighter) {
                newQualified.push(right);
              }
            }
            for (const node of generateFor(leftResults, nextK)) {
              yield node;
            }
          })();
          const rights = (function* () {
            if (!rightResults.length) {
              // ????????????case???????????????????????????
              yield null;
              return;
            }
            const newQualified = [...qualified];
            for (const left of Lefts) {
              if (aggregatedCases.get(left) === Difference.Lighter) {
                newQualified.push(left);
              }
            }
            for (const right of Rights) {
              if (aggregatedCases.get(right) === Difference.Heavier) {
                newQualified.push(right);
              }
            }
            for (const node of generateFor(rightResults, nextK)) {
              yield node;
            }
          })();
          const balances = (function* () {
            if (!balanceResults.length) {
              // ????????????case???????????????????????????
              yield null;
              return;
            }
            const newQualified = [...qualified, ...Lefts, ...Rights];
            for (const node of generateFor(balanceResults, nextK)) {
              yield node;
            }
          })();
          for (const left of lefts) {
            for (const right of rights) {
              for (const balance of balances) {
                if (!(left || right || balance)) {
                  continue;
                }
                yield {
                  type: NodeType.Strategy,
                  strategy,
                  cases: restCases,
                  children: {
                    [WeighResult.Left]: left,
                    [WeighResult.Balance]: balance,
                    [WeighResult.Right]: right,
                  },
                };
              }
            }
          }
        }
      }
    }
  }
  const allCases = cases(allProducts, diffectiveDifferences);
  const greedyLeastK = Math.ceil(Math.log(allCases.length) / Math.log(3));
  yield* generateFor(allCases, Math.min(k, greedyLeastK));
}

/**
 * ????????????????????????/???/??????
 * @param cases ????????????
 */
function aggregateCases(cases: Case[]): Map<Product, Difference> {
  return cases.reduce((aggregate, [bad, d]) => {
    return aggregate.set(bad, aggregate.has(bad) ? Difference.Normal : d);
  }, new Map<Product, Difference>());
}

/**
 * ????????????sum?????????seq??????????????????
 *
 * _.sum(seq) === sum && seq.every((n, i) => n <= maxArr[i])
 *
 * ??????????????????seq??????????????????????????????????????????????????????
 *
 * @param sum ???
 * @param seq ????????????
 * @param maxArr ??????????????????
 * @param workingIndex ???????????????????????????
 */
function* breakInto<Tuple extends number[]>(
  sum: number,
  seq: Tuple,
  maxArr: Tuple,
  workingIndex: number
): Generator<Tuple> {
  if (workingIndex === seq.length - 1) {
    if (maxArr[workingIndex] >= sum) {
      seq[workingIndex] = sum;
      yield seq;
    }
    return;
  }
  const max = Math.min(maxArr[workingIndex]!, sum);
  const nextIndex = workingIndex + 1;
  for (let i = 0; i <= max; i++) {
    seq[workingIndex] = i;
    yield* breakInto(sum - i, seq, maxArr, nextIndex);
  }
}
