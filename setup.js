(()=>{let c=new URL(location.href).searchParams.get("cdn"),e=c?decodeURIComponent(c):"https://unpkg.com",i="es-module-shims@1.6.1/dist/es-module-shims.js",l=c?`${e}/${i}`:`https://ga.jspm.io/npm:${i}`,p=`${e}/es-modularize@2.0.1/dist/browser.bundle.min.js`,o=(n,s,r)=>{let t=document.createElement("script");t.src=n,r&&(t.type="module"),(document.currentScript??document.body.querySelector("*"))?.after(t),t.onload=s},h=async()=>{let n=ESModularize.load(`${e}/react@18.2.0/umd/react.production.min.js`).async(),s=ESModularize.load(`${e}/react-dom@18.2.0/umd/react-dom.production.min.js`).async(),[r,t]=await Promise.all([n,s]),d=r.umd("React"),u=t.umd("ReactDOM");if(!d||!u)return;let S={imports:{react:d,"react-dom/client":u}};ESModularize.build(S)},a=()=>{o(p,()=>{h().then(()=>{o("./index.js",null,!0)})})},m=()=>typeof HTMLScriptElement.supports!="function"||!HTMLScriptElement.supports("importmap");m()?o(l,()=>{m()?o("./index.noimportmap.js",null,!0):a()}):a()})();
/**
 * @license GPL-3.0-or-later
 * Copyright (C) 2022  DarrenDanielDay <Darren_Daniel_Day@hotmail.com>
 *
 * This source code is licensed under the GPL-3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
//# sourceMappingURL=setup.js.map
