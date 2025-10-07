"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "instrumentation";
exports.ids = ["instrumentation"];
exports.modules = {

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("path");

/***/ }),

/***/ "(instrument)/./instrumentation.ts":
/*!****************************!*\
  !*** ./instrumentation.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   register: () => (/* binding */ register)\n/* harmony export */ });\nasync function register() {\n    console.log(\"✓ Server instrumentation running...\");\n    if (true) {\n        await __webpack_require__.e(/*! import() */ \"_instrument_store_EndpointStore_ts\").then(__webpack_require__.bind(__webpack_require__, /*! @/store/EndpointStore */ \"(instrument)/./store/EndpointStore.ts\"));\n        console.log(\" ✓ EndpointStore singleton initialized\");\n        await Promise.all(/*! import() */[__webpack_require__.e(\"vendor-chunks/@vercel+oidc@3.0.1\"), __webpack_require__.e(\"vendor-chunks/next@14.2.33_@opentelemetry+api@1.9.0_react-dom@18.3.1_react@18.3.1__react@18.3.1\"), __webpack_require__.e(\"vendor-chunks/@opentelemetry+api@1.9.0\"), __webpack_require__.e(\"vendor-chunks/zod@3.25.76\"), __webpack_require__.e(\"vendor-chunks/ai@5.0.60_zod@3.25.76\"), __webpack_require__.e(\"vendor-chunks/@ai-sdk+openai@2.0.44_zod@3.25.76\"), __webpack_require__.e(\"vendor-chunks/@ai-sdk+provider-utils@3.0.10_zod@3.25.76\"), __webpack_require__.e(\"vendor-chunks/@ai-sdk+gateway@1.0.33_zod@3.25.76\"), __webpack_require__.e(\"vendor-chunks/@ai-sdk+provider@2.0.0\"), __webpack_require__.e(\"vendor-chunks/eventsource-parser@3.0.6\"), __webpack_require__.e(\"_instrument_store_RecipeStore_ts\")]).then(__webpack_require__.bind(__webpack_require__, /*! @/store/RecipeStore */ \"(instrument)/./store/RecipeStore.ts\"));\n        console.log(\" ✓ RecipeStore singleton initialized\");\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vaW5zdHJ1bWVudGF0aW9uLnRzIiwibWFwcGluZ3MiOiI7Ozs7QUFBTyxlQUFlQTtJQUNsQkMsUUFBUUMsR0FBRyxDQUFDO0lBRVosSUFBSUMsSUFBNkIsRUFBVTtRQUN2QyxNQUFNLHFNQUFPO1FBQ2JGLFFBQVFDLEdBQUcsQ0FBQztRQUVaLE1BQU0sNDVCQUFPO1FBQ2JELFFBQVFDLEdBQUcsQ0FBQztJQUNoQjtBQUNKIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQG1vZHVsYXIvY29va2Jvb2svLi9pbnN0cnVtZW50YXRpb24udHM/ZDdkNyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVnaXN0ZXIoKSB7XG4gICAgY29uc29sZS5sb2coJ+KckyBTZXJ2ZXIgaW5zdHJ1bWVudGF0aW9uIHJ1bm5pbmcuLi4nKVxuXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5FWFRfUlVOVElNRSA9PT0gJ25vZGVqcycpIHtcbiAgICAgICAgYXdhaXQgaW1wb3J0KCdAL3N0b3JlL0VuZHBvaW50U3RvcmUnKVxuICAgICAgICBjb25zb2xlLmxvZygnIOKckyBFbmRwb2ludFN0b3JlIHNpbmdsZXRvbiBpbml0aWFsaXplZCcpXG5cbiAgICAgICAgYXdhaXQgaW1wb3J0KCdAL3N0b3JlL1JlY2lwZVN0b3JlJylcbiAgICAgICAgY29uc29sZS5sb2coJyDinJMgUmVjaXBlU3RvcmUgc2luZ2xldG9uIGluaXRpYWxpemVkJylcbiAgICB9XG59XG4iXSwibmFtZXMiOlsicmVnaXN0ZXIiLCJjb25zb2xlIiwibG9nIiwicHJvY2VzcyIsImVudiIsIk5FWFRfUlVOVElNRSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(instrument)/./instrumentation.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = (__webpack_exec__("(instrument)/./instrumentation.ts"));
module.exports = __webpack_exports__;

})();