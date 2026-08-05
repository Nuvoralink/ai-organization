/* global process, console */

/**
 * Shared `reserve` CLI — claim a UNIQUE value in a shared NAMESPACE for a parallel/swarm agent.
 *
 * THIS IS THE CANONICAL MANAGED SOURCE (`core/coordination/reserve-cli.mjs` in the AI-Organization
 * control plane), delivered to `.ai-organization/runtime/core/coordination/reserve-cli.mjs` in every
 * consuming project. DO NOT EDIT A DELIVERED COPY. A project ships only a two-line entry script that
 * imports `runReserveCli` and hands it that project's namespace config:
 *
 *   #!/usr/bin/env node
 *   import { runReserveCli } from '../.ai-organization/runtime/core/coordination/reserve-cli.mjs';
 *   import * as config from './reservation-config.mjs';
 *   process.exit(runReserveCli({ config, cliPath: 'scripts/reserve.mjs' }));
 *
 * A dispatch brief instructs the agent to run this FIRST (before creating the migration / ADR /
 * decision row / dev server) and to use exactly the printed value, so two agents in isolated worktrees
 * never both take "the next value" and collide. The shared ledger lives in the Git common dir, visible
 * to every worktree. A per-namespace collision gate is the mechanical backstop where one applies.
 *
 * stdout contract: on a successful claim the ONLY thing on stdout is the value to use, so
 * `DIR=$(node scripts/reserve.mjs migration my_slug)` works. Human context goes to stderr. `--json`
 * prints a single JSON object to stdout instead. Returns 0 success · 1 usage/validation/lock error.
 */

import { list, reconcile, release, reserve } from './namespace-reservation.mjs';

export function parseArgs(argv) {
  const options = { json: false, baseRef: undefined, command: null, positionals: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') options.json = true;
    else if (arg === '--list') options.command = 'list';
    else if (arg === '--reconcile') options.command = 'reconcile';
    else if (arg === '--release') {
      options.command = 'release';
      options.target = argv[index + 1];
      index += 1;
    } else if (arg === '--base-ref') {
      options.baseRef = argv[index + 1];
      index += 1;
    } else if (arg === '--help' || arg === '-h') options.command = 'help';
    else if (arg.startsWith('--')) throw new Error(`unknown flag: ${arg}`);
    else options.positionals.push(arg);
  }
  return options;
}

/**
 * Usage text derived from the PROJECT's own namespaces, so a project that wires three namespaces never
 * advertises a fourth it does not have. Each line shows the real argument shape the spec requires.
 */
export function helpText({ config, cliPath }) {
  const invoke = `node ${cliPath}`;
  const namespaceLines = config.NAMESPACE_NAMES.map((namespace) => {
    const spec = config.specFor(namespace);
    const shape = spec?.scope ? `${namespace} <${spec.scope.label}> <label>` : `${namespace} <label>`;
    return `  ${invoke} ${shape}`;
  });
  return [
    'reserve — claim a unique value in a shared namespace for a parallel agent.',
    '',
    ...namespaceLines,
    `  ${invoke} --list                      show outstanding reservations`,
    `  ${invoke} --reconcile [namespace]     retire merged + stale reservations`,
    `  ${invoke} --release <value>           abandon one reservation`,
    '  flags: --json  --base-ref <ref>  --help',
    `  namespaces: ${config.NAMESPACE_NAMES.join(', ')}`,
  ].join('\n');
}

function reservationLine(reservation) {
  const who = reservation.branch ?? reservation.agent ?? reservation.worktreePath ?? 'unknown';
  const scope = reservation.scope ? ` [${reservation.scope}]` : '';
  return `  ${reservation.namespace}${scope}: ${reservation.value}  (${who}, reserved ${reservation.reservedAt})`;
}

function runList(options, io) {
  const { reservations, ledgerFile } = list({});
  if (options.json) {
    io.stdout(JSON.stringify({ reservations, ledgerFile }, null, 2));
    return;
  }
  io.stderr(`Ledger: ${ledgerFile}`);
  if (reservations.length === 0) io.stderr('No outstanding reservations.');
  else {
    io.stderr(`Outstanding reservations (${reservations.length}):`);
    for (const reservation of reservations) io.stderr(reservationLine(reservation));
  }
}

function reconcileOne(config, namespace, baseRef) {
  const spec = config.specFor(namespace);
  if (!spec)
    throw new Error(
      `unknown namespace ${JSON.stringify(namespace)}; known: ${config.NAMESPACE_NAMES.join(', ')}`,
    );
  const result = reconcile({ namespace, spec, baseRef });
  return { namespace, ...result };
}

function runReconcile(config, options, io) {
  const targets =
    options.positionals.length > 0 ? options.positionals : [...config.NAMESPACE_NAMES];
  const results = targets.map((namespace) => reconcileOne(config, namespace, options.baseRef));
  if (options.json) {
    io.stdout(
      JSON.stringify(
        results.map((r) => ({
          namespace: r.namespace,
          baseRef: r.baseRef,
          merged: r.merged.map((x) => x.value),
          stalePruned: r.stalePruned.map((x) => x.value),
          outstanding: r.outstanding.length,
        })),
        null,
        2,
      ),
    );
    return;
  }
  for (const r of results) {
    io.stderr(
      `[${r.namespace}] base ${r.baseRef ?? 'unresolved'}: retired ${r.merged.length} merged, ` +
        `pruned ${r.stalePruned.length} stale; ${r.outstanding.length} outstanding.`,
    );
    for (const x of r.merged) io.stderr(`  merged  ${x.value}`);
    for (const x of r.stalePruned) io.stderr(`  pruned  ${x.value}`);
  }
}

function runRelease(options, io, help) {
  if (typeof options.target !== 'string' || options.target.trim() === '') {
    io.stderr(`reserve: --release needs a reservation value\n\n${help}`);
    return 1;
  }
  const result = release({ value: options.target });
  if (options.json) {
    io.stdout(JSON.stringify({ released: result.released.map((r) => r.value) }, null, 2));
    return 0;
  }
  if (result.released.length === 0) io.stderr(`No reservation matched ${options.target}.`);
  else
    io.stderr(
      `Released ${result.released.length}: ${result.released.map((r) => r.value).join(', ')}`,
    );
  return 0;
}

function runReserve(config, options, io, help) {
  const [namespace, ...rest] = options.positionals;
  const spec = config.specFor(namespace);
  if (!spec) {
    io.stderr(`reserve: unknown namespace ${JSON.stringify(namespace)}\n\n${help}`);
    return 1;
  }
  const requiresScope = Boolean(spec.scope);
  const expected = requiresScope ? 2 : 1;
  if (rest.length !== expected) {
    const shape = requiresScope
      ? `${namespace} <${spec.scope.label}> <label>`
      : `${namespace} <label>`;
    io.stderr(`reserve: expected \`${shape}\`\n\n${help}`);
    return 1;
  }
  const scope = requiresScope ? rest[0] : null;
  const label = requiresScope ? rest[1] : rest[0];

  const result = reserve({ namespace, spec, scope, label, baseRef: options.baseRef });

  if (options.json) {
    io.stdout(
      JSON.stringify(
        {
          namespace,
          scope: result.reservation.scope,
          value: result.value,
          number: result.number,
          reservedAt: result.reservation.reservedAt,
          branch: result.reservation.branch,
          baseRef: result.baseRef,
          merged: result.merged.map((r) => r.value),
          stalePruned: result.stalePruned.map((r) => r.value),
          ledgerFile: result.ledgerFile,
        },
        null,
        2,
      ),
    );
    return 0;
  }

  // Human context to stderr; the bare value on stdout is the agent's one consumable line.
  io.stderr(`Reserved ${namespace} value ${result.value} (base ${result.baseRef ?? 'unresolved'}).`);
  if (result.merged.length > 0 || result.stalePruned.length > 0) {
    io.stderr(
      `  (reconciled: ${result.merged.length} merged, ${result.stalePruned.length} stale pruned)`,
    );
  }
  io.stdout(result.value);
  return 0;
}

/**
 * Run the CLI against a project's namespace config. Returns the process exit code rather than calling
 * `process.exit`, so the meta-test can drive every branch in-process.
 *
 * `config` is the project's `reservation-config.mjs` module: `{ NAMESPACE_NAMES, specFor }`.
 * `cliPath` is the repo-relative path of the project's entry script, used only in usage text.
 */
export function runReserveCli({
  config,
  cliPath = 'scripts/reserve.mjs',
  argv = process.argv.slice(2),
  stdout = (line) => console.log(line),
  stderr = (line) => console.error(line),
} = {}) {
  if (!config || !Array.isArray(config.NAMESPACE_NAMES) || typeof config.specFor !== 'function') {
    stderr(
      'reserve: the project reservation config must export NAMESPACE_NAMES (array) and specFor (function)',
    );
    return 1;
  }
  const io = { stdout, stderr };
  const help = helpText({ config, cliPath });

  let options;
  try {
    options = parseArgs(argv);
  } catch (error) {
    stderr(`reserve: ${error.message}\n\n${help}`);
    return 1;
  }

  if (options.command === 'help') {
    stdout(help);
    return 0;
  }

  try {
    if (options.command === 'list') {
      runList(options, io);
      return 0;
    }
    if (options.command === 'reconcile') {
      runReconcile(config, options, io);
      return 0;
    }
    if (options.command === 'release') return runRelease(options, io, help);
    if (options.positionals.length === 0) {
      stderr(`reserve: a namespace is required\n\n${help}`);
      return 1;
    }
    return runReserve(config, options, io, help);
  } catch (error) {
    stderr(`reserve: ${error.message}`);
    return 1;
  }
}
