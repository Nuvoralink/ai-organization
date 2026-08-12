export const DISPATCH_BOUNDARY_PREFIX = 'CLAUDE_DISPATCH_BOUNDARY_JSON:';

export function normalizeDispatchBoundaryPath(value) {
  return String(value).replaceAll('\\', '/').replace(/^\.\//, '');
}

export function parseDispatchBoundary(file, content) {
  const lines = content.split(/\r?\n/);
  const rows = lines
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => line.startsWith(DISPATCH_BOUNDARY_PREFIX));
  if (rows.length === 0) return undefined;
  if (rows.length !== 1) {
    throw new Error(
      `${file}: expected exactly one ${DISPATCH_BOUNDARY_PREFIX} row, found ${rows.length}`,
    );
  }
  try {
    return {
      value: JSON.parse(rows[0].line.slice(DISPATCH_BOUNDARY_PREFIX.length)),
      line: rows[0].number,
    };
  } catch (error) {
    throw new Error(`${file}:${rows[0].number}: invalid dispatch boundary JSON: ${String(error)}`, {
      cause: error,
    });
  }
}
