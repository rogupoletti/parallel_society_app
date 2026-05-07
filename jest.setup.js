// Pre-define globals as NON-CONFIGURABLE before expo/winter tries to lazily install them.
// expo/winter/installGlobal.ts checks Object.getOwnPropertyDescriptor().configurable
// and skips the override if configurable === false. This prevents require() calls
// that Jest 30's sandbox blocks.

// 1. structuredClone — Node 22 already has it
const existingStructuredClone = typeof globalThis.structuredClone === 'function' 
  ? globalThis.structuredClone 
  : function structuredClone(value) { return JSON.parse(JSON.stringify(value)); };

Object.defineProperty(globalThis, 'structuredClone', {
  value: existingStructuredClone,
  configurable: false,
  enumerable: true,
  writable: true
});

// 2. __ExpoImportMetaRegistry — used by Expo for import.meta support
if (typeof globalThis.__ExpoImportMetaRegistry === 'undefined') {
  Object.defineProperty(globalThis, '__ExpoImportMetaRegistry', {
    value: { url: 'file://', get: () => ({ url: 'file://' }) },
    configurable: false,
    enumerable: false,
    writable: true
  });
}

// 3. TextDecoder / TextDecoderStream / TextEncoderStream — Node has these
const globalsToLock = ['TextDecoder', 'TextDecoderStream', 'TextEncoderStream', 'URL', 'URLSearchParams'];
for (const name of globalsToLock) {
  if (typeof globalThis[name] !== 'undefined') {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
    if (descriptor && descriptor.configurable) {
      Object.defineProperty(globalThis, name, {
        value: globalThis[name],
        configurable: false,
        enumerable: true,
        writable: true
      });
    }
  }
}
