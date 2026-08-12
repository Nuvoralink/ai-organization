/**
 * Pre-flight scope + cost estimate for the assurance pipeline (Phase 0 spine component "c" pre-flight).
 *
 * `previewScope` returns a token/cost preview computed PURELY from static inputs (the stage plan and
 * the config's cost assumptions). It is handed the `backend` on purpose — so the "zero spend" promise
 * is a testable property of a function that COULD call the model and deliberately does not — but it
 * never invokes it. The DoD test passes a spy backend and asserts its invocation count stays 0.
 */

const DEFAULT_TOKENS_PER_CALL = 2000;
const DEFAULT_USD_PER_MILLION_TOKENS = 3;

/**
 * @param {object}   args
 * @param {string}   args.target      the target ref being previewed
 * @param {object}   args.config      { estimate?: { tokens_per_call?, usd_per_million_tokens? } }
 * @param {Array}    args.stages      stage descriptors: { name, kind: 'det'|'llm', lensCount? }
 * @param {object=}  args.backend     present but intentionally never invoked (zero-spend proof)
 */
export function previewScope({ target, config = {}, stages, backend }) {
  void backend; // estimate is a pre-flight: it must NEVER invoke the backend (zero token spend).
  if (!Array.isArray(stages) || stages.length === 0) throw new Error('previewScope requires a stage plan');

  const tokensPerCall = config.estimate?.tokens_per_call ?? DEFAULT_TOKENS_PER_CALL;
  const usdPerMillion = config.estimate?.usd_per_million_tokens ?? DEFAULT_USD_PER_MILLION_TOKENS;

  let modelCallCount = 0;
  const perStage = stages.map((stage) => {
    const calls = stage.kind === 'llm' ? Math.max(1, stage.lensCount ?? 1) : 0;
    modelCallCount += calls;
    return { name: stage.name, kind: stage.kind, model_calls: calls };
  });

  const estimatedTokens = modelCallCount * tokensPerCall;
  const estimatedCostUsd = Number(((estimatedTokens / 1_000_000) * usdPerMillion).toFixed(6));

  return {
    target,
    stage_count: stages.length,
    model_call_count: modelCallCount,
    estimated_tokens: estimatedTokens,
    estimated_cost_usd: estimatedCostUsd,
    backend_invocations: 0, // by construction — see `void backend` above
    assumptions: { tokens_per_call: tokensPerCall, usd_per_million_tokens: usdPerMillion },
    per_stage: perStage,
  };
}
