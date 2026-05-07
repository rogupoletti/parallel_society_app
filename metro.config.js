const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Polyfill import.meta via custom transformer
config.transformer.babelTransformerPath = require.resolve('./metro.transformer.js');

config.resolver.sourceExts.push('mjs', 'cjs');

module.exports = config;
