// Provide the native structuredClone if available, otherwise a basic polyfill
module.exports = typeof structuredClone !== 'undefined' 
  ? structuredClone 
  : function structuredClonePolyfill(value) {
      return JSON.parse(JSON.stringify(value));
    };
module.exports.default = module.exports;
