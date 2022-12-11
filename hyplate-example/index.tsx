/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { appendChild, select } from "hyplate/core";
import { For, If, Show } from "hyplate/directive";
import { jsxRef } from "hyplate/jsx-runtime";
import { query, source, subscribe } from "hyplate/store";
import { CleanUpFunc, FunctionalComponent, Query, Source } from "hyplate/types";
import { findSolution } from "../../out/core.js";
import { DefectiveDifference, Difference, NodeType, Strategy, WeighResult } from "../../out/defs.js";
import { ConnectedTreeNode, connectParent } from "../../out/utils.js";
import "../style.css";
//#region Start up
const url = new URL(location.href);
const params = url.searchParams;
const searchLanguage = params.get("lang") ?? "";
const initCount = +(params.get("count") ?? "") || undefined;
const initTimes = +(params.get("times") ?? "") || undefined;
const initDiffs = +(params.get("diff") ?? "") || undefined;
const knownLangs = ["zh", "en"];
const language = knownLangs.includes(searchLanguage) ? searchLanguage : "zh";
if (language && document.documentElement.lang !== language) {
  document.documentElement.lang = language;
}
const i18nModule =
  language === "en"
    ? await import("../i18n/en.json", { assert: { type: "json" } })
    : await import("../i18n/zh.json", { assert: { type: "json" } });
const i18n = i18nModule.default;
document.title += ` - ${i18n["app.description"]}`;
//#endregion
//#region Header component
const Header: FunctionalComponent = () => {
  return (
    <header>
      <nav>
        <div role={"application"}>
          <img src="../icon.svg" class="logo" alt="icon.svg"></img>
          <img src="../text.svg" class="app-text" alt="text.svg"></img>
        </div>
        <div class="menu" role={"menu"}>
          <div class="menu-item" role={"menuitem"}>
            <a href="https://github.com/DarrenDanielDay/Libra" target={"_blank"}>
              <img src="../github.svg" alt="github.svg" class="community"></img>
            </a>
          </div>
          <div class="menu-item" role={"menuitem"}>
            <select
              onChange={({ target }) => {
                const url = new URL(location.href);
                url.searchParams.delete("lang");
                url.searchParams.set("lang", (target as HTMLSelectElement).value);
                location.href = url.href;
              }}
            >
              <option value="zh" selected={language === "zh"}>
                简体中文
              </option>
              <option value="en" selected={language === "en"}>
                English
              </option>
            </select>
          </div>
        </div>
      </nav>
    </header>
  );
};
//#endregion
//#region Conditions component
enum Diff {
  Lighter = -1,
  Unknown = 0,
  Heavier = 1,
}
function diffs(diff: Diff): DefectiveDifference[] {
  switch (diff) {
    case Diff.Lighter:
      return [Difference.Lighter];
    case Diff.Heavier:
      return [Difference.Heavier];
    default:
      return [Difference.Lighter, Difference.Heavier];
  }
}
interface Condition {
  count: number;
  times: number;
  diff: Diff;
}
const Conditions: FunctionalComponent<{
  confirm(condition: Condition): void;
  reset(): void;
}> = ({ confirm, reset }) => {
  return (
    <form
      class="conditions"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const fields: (keyof Condition)[] = ["count", "times", "diff"];
        const formValue = fields.reduce<Partial<Condition>>((acc, field) => {
          const value = formData.get(field);
          if (typeof value === "string") {
            acc[field] = +value;
          }
          return acc;
        }, {});
        if (formValue.count && formValue.times && formValue.diff != null) {
          for (const [key, value] of Object.entries(formValue)) {
            params.set(key, value.toString());
          }
          history.replaceState({}, "", url);
          confirm(formValue as Condition);
        }
      }}
      onReset={reset}
    >
      <div class="condition">
        <label for="count">{i18n["label.count"]}</label>
        <input id="count" name="count" type={"number"} value={initCount?.toString()} required></input>
      </div>
      <div class="condition">
        <label for="times">{i18n["label.times"]}</label>
        <input id="times" name="times" type={"number"} value={initTimes?.toString()} required></input>
      </div>
      <div class="condition">
        <label for="diff">{i18n["label.diff"]}</label>
        <select id="diff" name="diff" value={initDiffs} required>
          {(
            [
              [Diff.Unknown, i18n["diff.unknown"]],
              [Diff.Heavier, i18n["diff.heavier"]],
              [Diff.Lighter, i18n["diff.lighter"]],
            ] as const
          ).map(([diff, text]) => (
            <option key={diff} value={diff.toString()}>
              {text}
            </option>
          ))}
        </select>
      </div>
      <div class="actions">
        <button type={"submit"} class="submit">
          {i18n["actions.confirm"]}
        </button>
        <button type={"reset"} class="reset">
          {i18n["actions.reset"]}
        </button>
      </div>
    </form>
  );
};
//#endregion
//#region Products Group
const ProductGroup: FunctionalComponent<{ products: Query<Iterable<number>> }> = ({ products }) => {
  return (attach) => {
    const host = jsxRef<HTMLDivElement>();
    const [unmountDiv] = (<div ref={host} class="products"></div>)(attach);
    const div = host.el!;
    const addChildren = appendChild<HTMLDivElement>(div);
    let unmountChildren: CleanUpFunc | null = null;
    const unsubscribe = subscribe(products, ([...productIds]) => {
      unmountChildren?.();
      [unmountChildren] = (<>
        {productIds.map((product, i) => {
          return (
            <>
              {!i ? "" : <code>+</code>}
              <span class="product">P{product}</span>
            </>
          );
        })}
      </>)(addChildren);
    });
    return [
      () => {
        unsubscribe();
        unmountChildren?.();
        unmountDiv();
      },
      undefined,
      () => [div, div],
    ];
  };
};
//#endregion

//#region Compare component
const Compare: FunctionalComponent<{
  lefts: Query<Iterable<number>>;
  rights: Query<Iterable<number>>;
  comparator: string;
}> = ({ lefts, rights, comparator }) => {
  return (
    <div class="compare">
      <ProductGroup products={lefts}></ProductGroup>
      <code>{comparator}</code>
      <ProductGroup products={rights}></ProductGroup>
    </div>
  );
};
//#endregion

//#region Strategy Tree component
const diffText = {
  [Difference.Lighter]: i18n["diff.lighter"],
  [Difference.Heavier]: i18n["diff.heavier"],
};
const getSVGByPath = (content: string): JSX.Element => {
  const template = document.createElement("template");
  template.innerHTML = content;
  const SVGWrapperComponent: FunctionalComponent = () => {
    return (attach) => {
      const containerRef = jsxRef<HTMLDivElement>();
      const rendered = (<div ref={containerRef}></div>)(attach);
      const svg = template.content.cloneNode(true);
      const containerElement = containerRef.el!;
      containerElement.appendChild(svg);
      return rendered;
    };
  };
  return <SVGWrapperComponent></SVGWrapperComponent>;
};
const [leftSVG, balanceSVG, rightSVG] = await Promise.all(
  ["../balance-scale-left.svg", "../balance-scale.svg", "../balance-scale-right.svg"].map(async (path) => {
    const response = await fetch(path);
    const content = await response.text();
    return content;
  })
);
const weighResultOptions: {
  svg: JSX.Element;
  result: WeighResult;
  position: string;
}[] = [
  {
    svg: getSVGByPath(leftSVG),
    result: WeighResult.Right,
    position: "left",
  },
  {
    svg: getSVGByPath(balanceSVG),
    result: WeighResult.Balance,
    position: "middle",
  },
  {
    svg: getSVGByPath(rightSVG),
    result: WeighResult.Left,
    position: "right",
  },
];
const RenderNode: FunctionalComponent<{
  node: Query<ConnectedTreeNode>;
  move(next: ConnectedTreeNode | false): void;
}> = ({ node, move }) => {
  const back = (
    <div class="actions">
      <Show when={query(() => !!node.val.parent)}>
        <button
          class="reset"
          onClick={() => {
            move(node.val.parent ?? false);
          }}
        >
          {i18n["actions.back"]}
        </button>
      </Show>
    </div>
  );
  const renderNode = (child: JSX.Element, info: string, type: string) => (
    <div class={`${type} node`}>
      <p class="info">{info}</p>
      {child}
      {back}
    </div>
  );
  return (
    <If condition={query(() => node.val.type == null)}>
      {{
        then: renderNode(<></>, i18n["info.impossible"], "null"),
        else: (
          <If condition={query(() => node.val.type === NodeType.Conclusion)}>
            {{
              then: (attach) => {
                if (node.val.type !== NodeType.Conclusion) throw new Error("");
                const [bad, diff] = node.val.enumerated;
                const context = {
                  bad,
                  diff: diffText[diff],
                };
                return renderNode(
                  <></>,
                  i18n["info.conclution"].replace(/\{(.+?)\}/g, (_, prop) => Reflect.get(context, prop)),
                  "conclusion"
                )(attach);
              },
              else: (attach) => {
                const lefts = query(() => {
                  const n = node.val;
                  if (n.type !== NodeType.Strategy) return [];
                  const {
                    strategy: [lefts],
                  } = n;
                  return lefts;
                });
                const rights = query(() => {
                  const n = node.val;
                  if (n.type !== NodeType.Strategy) return [];
                  const {
                    strategy: [, rights],
                  } = n;
                  return rights;
                });
                return renderNode(
                  <>
                    <Compare lefts={lefts} rights={rights} comparator="vs"></Compare>
                    <div class="choices">
                      {weighResultOptions.map(({ svg, result, position }, i) => {
                        const choose = () => {
                          const n = node.val;
                          if (n.type !== NodeType.Strategy) throw new Error("Impossible");
                          move(n.children[result]);
                        };
                        return (
                          <div
                            key={i}
                            class={`choice ${position}`}
                            role={"button"}
                            tabIndex={0}
                            onClick={choose}
                            onKeydown={(e) => {
                              e.key.toLowerCase() === "enter" && choose();
                            }}
                          >
                            {svg}
                          </div>
                        );
                      })}
                    </div>
                  </>,
                  i18n["info.choose"],
                  "choose"
                )(attach);
              },
            }}
          </If>
        ),
      }}
    </If>
  );
};
//#endregion

//#region Weigh History component
type WeighHistoryItem = {
  strategy: Strategy;
  result: WeighResult;
};
const compare = (result: WeighResult) => {
  switch (result) {
    case WeighResult.Left:
      return "<";
    case WeighResult.Right:
      return ">";
    default:
      return "=";
  }
};
const WeighHistory: FunctionalComponent<{
  records: Query<WeighHistoryItem[]>;
}> = ({ records }) => {
  return (a) => {
    return (<div class="weigh-history">
      <p>{i18n["label.history"]}</p>
      <For of={records}>
        {({ strategy: [lefts, rights], result }) => (
          <Compare lefts={source(lefts)} rights={source(rights)} comparator={compare(result)} />
        )}
      </For>
    </div>)(a);
  };
};
//#endregion

//#region App component
type CurrentNode = ConnectedTreeNode | false;
type AppState = {
  node: CurrentNode;
  root: CurrentNode;
  message: string;
};
const useState = <T extends object>(initState: T) => {
  const mappedSource = Object.fromEntries(Object.entries(initState).map(([k, v]) => [k, source(v)])) as {
    [K in keyof T]: Source<T[K]>;
  };
  const snapshot = () =>
    Object.fromEntries(Object.entries<Query<unknown>>(mappedSource).map(([k, v]) => [k, v.val])) as T;
  const setState = (payload: T | ((state: T) => T)) => {
    const next = typeof payload === "function" ? payload(snapshot()) : payload;
    for (const [k, v] of Object.entries(next)) {
      mappedSource[k as keyof T].set(v);
    }
  };
  return [mappedSource, setState] as const;
};
const App: FunctionalComponent = () => {
  const [state, setState] = useState<AppState>({
    node: false,
    root: false,
    message: "",
  });
  const { node, root, message } = state;
  const setNode = (newNode: CurrentNode) => setState((s) => ({ ...s, node: newNode }));
  const weighRecords = query(() => {
    return (
      node.val &&
      ((): WeighHistoryItem[] => {
        const path: [strategy: Strategy, choice: WeighResult][] = [];
        for (let pointer = node.val; pointer.parent && pointer !== root.val; pointer = pointer.parent) {
          const parent = pointer.parent;
          if (parent.type === NodeType.Strategy /** Actually always true. */) {
            path.push([parent.strategy, weighResultOptions.find((o) => parent.children[o.result] === pointer)!.result]);
          }
        }
        return path.reverse().map(([strategy, result]) => ({ strategy, result }));
      })()
    );
  });
  Object.assign(globalThis, { weighRecords });
  const onConfirm = ({ count, times, diff }: Condition): void => {
    const kinds = diffs(diff);
    for (const solution of findSolution(count, times, kinds)) {
      const foundNode = connectParent(solution);
      setState((s) => ({ ...s, node: foundNode, root: foundNode, message: "" }));
      return;
    }
    setState((s) => ({
      ...s,
      node: false,
      root: false,
      message: i18n["info.no.solution"],
    }));
  };
  const onClear = () => setState({ message: "", node: false, root: false });
  return (
    <div>
      <Header></Header>
      <main>
        <Conditions confirm={onConfirm} reset={onClear}></Conditions>
        <Show when={query(() => !!message.val)}>
          <div class="alert alert-danger" role={"alert"}>
            {message}
          </div>
        </Show>
        <Show when={query(() => !!node.val)}>
          <RenderNode node={node as Query<ConnectedTreeNode>} move={setNode}></RenderNode>
        </Show>
        <Show
          when={query(() => {
            const w = weighRecords.val;
            return w && !!w.length;
          })}
        >
          <WeighHistory records={weighRecords as Query<WeighHistoryItem[]>}></WeighHistory>
        </Show>
      </main>
    </div>
  );
};
//#endregion
//#region main
const app = select("div#app")!;
(<App />)(appendChild(app));
//#endregion
