const upstreamTransformer = require('@expo/metro-config/babel-transformer');

module.exports.transform = async ({ src, filename, options }) => {
  // Strip import.meta syntax from external ESM modules (like viem or reown)
  // because Metro transpiles to CommonJS and the browser throws SyntaxError.
  if (filename.includes('node_modules')) {
    if (src.includes('import.meta')) {
      src = src.replace(/import\.meta\.url/g, '"file://"');
      src = src.replace(/import\.meta\.env/g, '{}');
      src = src.replace(/import\.meta/g, '{}');
    }
  }
  
  return upstreamTransformer.transform({ src, filename, options });
};
