export const TEST_FILE_PATTERNS = Object.freeze([
  /\.(?:test|spec)\.(?:ts|tsx|mts|mjs)$/u,
  /Regression[^/\\]*\.(?:ts|mjs)$/u,
]);

export function isTestFile(file) {
  return TEST_FILE_PATTERNS.some((pattern) => pattern.test(file));
}
