export default {
  testEnvironment: "jsdom",
  transform: {},
  roots: ["<rootDir>/tests"],
  moduleFileExtensions: ["js", "mjs"],
  testMatch: ["**/*.test.js"],
  testPathIgnorePatterns: ["/node_modules/", "/weather/", "/routes/", "/models/"],
};
