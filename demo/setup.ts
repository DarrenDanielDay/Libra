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
  const react = ESModularize.load(`${cdnRoot}/react@18.2.0/umd/react.production.min.js`).sync().umd("React");
  const reactDOM = ESModularize.load(`${cdnRoot}/react-dom@18.2.0/umd/react-dom.production.min.js`)
    .sync()
    .umd("ReactDOM");
  if (!react || !reactDOM) {
    throw 0;
  }
  const notSupported = () =>
    typeof HTMLScriptElement.supports !== "function" || !HTMLScriptElement.supports("importmap");
  if (notSupported()) {
    const fallback = () => {
      document.removeEventListener("DOMContentLoaded", fallback);
      console.clear();
      const script = document.head.querySelector(`script[type="module"]`);
      if (script instanceof HTMLScriptElement) {
        document.head.removeChild(script);
        const altScript = document.createElement("script");
        altScript.src = "./index.noimportmap.js";
        altScript.type = "module";
        document.body.appendChild(altScript);
      } else {
        console.log("?");
      }
    };
    document.addEventListener("DOMContentLoaded", fallback);
  } else {
    const importMap = {
      imports: {
        react: react,
        "react-dom/client": reactDOM,
      },
    };
    ESModularize.build(importMap);
  }
})();
