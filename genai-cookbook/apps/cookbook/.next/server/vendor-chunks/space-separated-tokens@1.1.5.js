"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/space-separated-tokens@1.1.5";
exports.ids = ["vendor-chunks/space-separated-tokens@1.1.5"];
exports.modules = {

/***/ "(ssr)/../../node_modules/.pnpm/space-separated-tokens@1.1.5/node_modules/space-separated-tokens/index.js":
/*!**********************************************************************************************************!*\
  !*** ../../node_modules/.pnpm/space-separated-tokens@1.1.5/node_modules/space-separated-tokens/index.js ***!
  \**********************************************************************************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("\n\nexports.parse = parse\nexports.stringify = stringify\n\nvar empty = ''\nvar space = ' '\nvar whiteSpace = /[ \\t\\n\\r\\f]+/g\n\nfunction parse(value) {\n  var input = String(value || empty).trim()\n  return input === empty ? [] : input.split(whiteSpace)\n}\n\nfunction stringify(values) {\n  return values.join(space).trim()\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vLi4vbm9kZV9tb2R1bGVzLy5wbnBtL3NwYWNlLXNlcGFyYXRlZC10b2tlbnNAMS4xLjUvbm9kZV9tb2R1bGVzL3NwYWNlLXNlcGFyYXRlZC10b2tlbnMvaW5kZXguanMiLCJtYXBwaW5ncyI6IkFBQVk7O0FBRVosYUFBYTtBQUNiLGlCQUFpQjs7QUFFakI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSIsInNvdXJjZXMiOlsid2VicGFjazovL0Btb2R1bGFyL2Nvb2tib29rLy4uLy4uL25vZGVfbW9kdWxlcy8ucG5wbS9zcGFjZS1zZXBhcmF0ZWQtdG9rZW5zQDEuMS41L25vZGVfbW9kdWxlcy9zcGFjZS1zZXBhcmF0ZWQtdG9rZW5zL2luZGV4LmpzPzEwY2IiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnXG5cbmV4cG9ydHMucGFyc2UgPSBwYXJzZVxuZXhwb3J0cy5zdHJpbmdpZnkgPSBzdHJpbmdpZnlcblxudmFyIGVtcHR5ID0gJydcbnZhciBzcGFjZSA9ICcgJ1xudmFyIHdoaXRlU3BhY2UgPSAvWyBcXHRcXG5cXHJcXGZdKy9nXG5cbmZ1bmN0aW9uIHBhcnNlKHZhbHVlKSB7XG4gIHZhciBpbnB1dCA9IFN0cmluZyh2YWx1ZSB8fCBlbXB0eSkudHJpbSgpXG4gIHJldHVybiBpbnB1dCA9PT0gZW1wdHkgPyBbXSA6IGlucHV0LnNwbGl0KHdoaXRlU3BhY2UpXG59XG5cbmZ1bmN0aW9uIHN0cmluZ2lmeSh2YWx1ZXMpIHtcbiAgcmV0dXJuIHZhbHVlcy5qb2luKHNwYWNlKS50cmltKClcbn1cbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(ssr)/../../node_modules/.pnpm/space-separated-tokens@1.1.5/node_modules/space-separated-tokens/index.js\n");

/***/ })

};
;