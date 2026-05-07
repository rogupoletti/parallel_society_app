module.exports = {
  preset: "jest-expo",
  setupFiles: [
    "<rootDir>/jest.setup.js"
  ],
  moduleNameMapper: {
    // Prevent the Expo Winter runtime from trying to polyfill structuredClone etc.
    '@ungap/structured-clone': '<rootDir>/jest.mocks/structuredClone.js'
  }
};
