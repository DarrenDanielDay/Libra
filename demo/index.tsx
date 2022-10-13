import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { findSolution } from "../src/core";
import { DefectiveDifference, Difference, NodeType, Strategy, TreeNode, WeighResult } from "../src/defs";
import { cases, ConnectedTreeNode, connectParent, TestTree } from "../src/utils";
import { BalanceSVG } from "./balance-scale";
import { LeftSVG } from "./balance-scale-left";
import { RightSVG } from "./balance-scale-right";

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
    ? await import("./i18n/en.json", { assert: { type: "json" } })
    : await import("./i18n/zh.json", { assert: { type: "json" } });
const i18n = i18nModule.default;
document.title += ` - ${i18n["app.description"]}`;
//#endregion
//#region Header component
const Header: React.FC = React.memo(() => {
  return (
    <header>
      <nav>
        <div role={"application"}>
          <img src="./icon.svg" className="logo" alt="icon.svg"></img>
          <img src="./text.svg" className="app-text" alt="text.svg"></img>
        </div>
        <div className="menu" role={"menu"}>
          <div className="menu-item" role={"menuitem"}>
            <a href="https://github.com/DarrenDanielDay/Libra" target={"_blank"}>
              <img src="./github.svg" alt="github.svg" className="community"></img>
            </a>
          </div>
          <div className="menu-item" role={"menuitem"}>
            <select
              value={language}
              onChange={({ target }) => {
                const url = new URL(location.href);
                url.searchParams.delete("lang");
                url.searchParams.set("lang", target.value);
                location.href = url.href;
              }}
            >
              <option value="zh">简体中文</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </nav>
    </header>
  );
});
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
const Conditions: React.FC<{
  confirm(condition: Condition): void;
  clear(): void;
}> = ({ confirm }) => {
  return (
    <form
      className="conditions"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
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
    >
      <div className="condition">
        <label htmlFor="count">{i18n["label.count"]}</label>
        <input id="count" name="count" type={"number"} defaultValue={initCount} required></input>
      </div>
      <div className="condition">
        <label htmlFor="count">{i18n["label.times"]}</label>
        <input id="times" name="times" type={"number"} defaultValue={initTimes} required></input>
      </div>
      <div className="condition">
        <label htmlFor="diff">{i18n["label.diff"]}</label>
        <select id="diff" name="diff" defaultValue={initDiffs} required>
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
      <div className="actions">
        <button type={"submit"} className="submit">
          {i18n["actions.confirm"]}
        </button>
        <button type={"reset"} className="reset">
          {i18n["actions.clear"]}
        </button>
      </div>
    </form>
  );
};
//#endregion
//#region Products Group
const ProductGroup: React.FC<{ products: number[] }> = ({ products }) => (
  <div className="balance-items">
    {products.map((product, i) => (
      <React.Fragment key={i}>
        {!!i && <code>+</code>}
        <span className="balance-item">P{product}</span>
      </React.Fragment>
    ))}
  </div>
);
//#endregion
//#region Strategy Tree component
const diffText = {
  [Difference.Lighter]: i18n["diff.lighter"],
  [Difference.Heavier]: i18n["diff.heavier"],
};
const weighResultMapping: Record<
  WeighResult,
  {
    svg: JSX.Element;
    result: WeighResult;
  }
> = {
  [WeighResult.Right]: {
    svg: LeftSVG,
    result: WeighResult.Right,
  },
  [WeighResult.Balance]: {
    svg: BalanceSVG,
    result: WeighResult.Balance,
  },
  [WeighResult.Left]: {
    svg: RightSVG,
    result: WeighResult.Left,
  },
};
const weighResultOptions = Object.values(weighResultMapping);
const RenderNode: React.FC<{
  node: ConnectedTreeNode;
  move(next: ConnectedTreeNode | false): void;
}> = ({ node, move }) => {
  const back = (
    <div className="actions">
      {!!node.parent && (
        <button
          className="reset"
          onClick={() => {
            move(node.parent ?? false);
          }}
        >
          {i18n["actions.back"]}
        </button>
      )}
    </div>
  );
  if (node.type == null) {
    return (
      <div className="null-node">
        <p>{i18n["info.impossible"]}</p>
        {back}
      </div>
    );
  }
  if (node.type === NodeType.Conclusion) {
    const [bad, diff] = node.enumerated;
    const context = {
      bad,
      diff: diffText[diff],
    };
    return (
      <div className="conclusion-node">
        <p>{i18n["info.conclution"].replace(/\{(.+?)\}/g, (_, prop) => Reflect.get(context, prop))}</p>
        {back}
      </div>
    );
  }
  const {
    strategy: [[...lefts], [...rights]],
  } = node;

  return (
    <div className="strategy-node">
      <p>{i18n["info.choose"]}</p>
      <div className="strategy">
        <ProductGroup products={lefts}></ProductGroup>
        <span>vs</span>
        <ProductGroup products={rights}></ProductGroup>
      </div>
      <div className="choices">
        {weighResultOptions.map(({ svg, result }, i) => (
          <div
            className="choice"
            key={i}
            onClick={() => {
              move(node.children[result]);
            }}
          >
            {svg}
          </div>
        ))}
      </div>
      {back}
    </div>
  );
};
//#endregion

//#region Weigh History component
type WeighHistoryItem = {
  strategy: Strategy;
  result: WeighResult;
};
const WeighHistory: React.FC<{
  records: WeighHistoryItem[];
}> = ({ records }) => {
  return (
    <div className="weigh-history">
      {records.map(({ strategy: [[...lefts], [...rights]], result: choice }, i) => (
        <div key={i} className="history-item">
          <ProductGroup products={lefts}></ProductGroup>
          <code>
            {(() => {
              switch (choice) {
                case WeighResult.Left:
                  return "<";
                case WeighResult.Right:
                  return ">";
                default:
                  return "=";
              }
            })()}
          </code>
          <ProductGroup products={rights}></ProductGroup>
        </div>
      ))}
    </div>
  );
};
//#endregion

//#region App component
type CurrentNode = ConnectedTreeNode | false;
type AppState = {
  node: CurrentNode;
  root: CurrentNode;
  message: string;
};
const App: React.FC = () => {
  const [state, setState] = React.useState<AppState>({
    node: false,
    root: false,
    message: "",
  });
  const { node, root, message } = state;
  const setNode = (newNode: CurrentNode) => setState((s) => ({ ...s, node: newNode }));
  const weighRecords =
    node &&
    history &&
    ((): WeighHistoryItem[] => {
      const path: [strategy: Strategy, choice: WeighResult][] = [];
      for (let pointer = node; pointer.parent && pointer !== root; pointer = pointer.parent) {
        const parent = pointer.parent;
        if (parent.type === NodeType.Strategy /** Actually always true. */) {
          path.push([parent.strategy, weighResultOptions.find((o) => parent.children[o.result] === pointer)!.result]);
        }
      }
      return path.reverse().map(([strategy, result]) => ({ strategy, result }));
    })();
  return (
    <div>
      <Header></Header>
      <main>
        <Conditions
          confirm={({ count, times, diff }) => {
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
          }}
          clear={() => setNode(false)}
        ></Conditions>
        {message && (
          <div className="alert alert-danger" role={"alert"}>
            {message}
          </div>
        )}
        {node && <RenderNode node={node} move={setNode}></RenderNode>}
        {weighRecords && <WeighHistory records={weighRecords}></WeighHistory>}
      </main>
    </div>
  );
};
//#endregion
//#region main
const app = document.querySelector("div")!;
ReactDOM.createRoot(app).render(<App />);
//#endregion
