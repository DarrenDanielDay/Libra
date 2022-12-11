/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
/// <reference path="../node_modules/es-modularize/dist/index.d.ts" />
(() => {
  const query = new URL(location.href);
  const cdn = query.searchParams.get("cdn");
  const cdnRoot = cdn ? decodeURIComponent(cdn) : "https://unpkg.com";
  const shimsSubPath = "es-module-shims@1.6.1/dist/es-module-shims.js";
  const shimsUrl = cdn ? `${cdnRoot}/${shimsSubPath}` : `https://ga.jspm.io/npm:${shimsSubPath}`;
  const esModularize = `${cdnRoot}/es-modularize@2.0.1/dist/browser.bundle.min.js`;
  const runScript = (url: string, callback: (() => void) | null, asModule?: boolean) => {
    const script = document.createElement("script");
    script.src = url;
    if (asModule) {
      script.type = "module";
    }
    (document.currentScript ?? document.body.querySelector("*"))?.after(script);
    script.onload = callback;
  };
  const aliasReact = async () => {
    const reactP = ESModularize.load(`${cdnRoot}/react@18.2.0/umd/react.production.min.js`).async();
    const reactDomP = ESModularize.load(`${cdnRoot}/react-dom@18.2.0/umd/react-dom.production.min.js`).async();
    const [reactC, reactDomC] = await Promise.all([reactP, reactDomP]);
    const react = reactC.umd("React");
    const reactDOM = reactDomC.umd("ReactDOM");
    if (!react || !reactDOM) {
      return;
    }
    const importMap = {
      imports: {
        react: react,
        "react-dom/client": reactDOM,
      },
    };
    ESModularize.build(importMap);
  };
  const init = () => {
    runScript(esModularize, () => {
      aliasReact().then(() => {
        runScript("./index.js", null, true);
      });
    });
  };
  const notSupported = () =>
    typeof HTMLScriptElement.supports !== "function" || !HTMLScriptElement.supports("importmap");
  if (notSupported()) {
    runScript(shimsUrl, () => {
      if (notSupported()) {
        runScript("./index.noimportmap.js", null, true);
      } else {
        init();
      }
    });
  } else {
    init();
  }
})();
