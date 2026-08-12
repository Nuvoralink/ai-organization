/**
 * S2 deterministic static-evidence stage. Adapter selection is stack-parametric and may be
 * injected through ctx.adapters for tests; every normalized finding is validated before it leaves
 * the stage.
 */
import { validateArtifact } from '../artifacts.mjs';
import { schemaPath } from '../paths.mjs';
import { defineStage } from '../stage-runner.mjs';
import { getAdaptersForStack } from '../adapters/static/registry.mjs';

export const STATIC_FINDING_SCHEMA = schemaPath('static-finding.v1.schema.json');
export const STATIC_FINDINGS_SCHEMA = schemaPath('static-findings.v1.schema.json');

export const s2StaticEvidence = defineStage({
  name: 's2-static-evidence',
  kind: 'det',
  outputSchema: STATIC_FINDINGS_SCHEMA,
  run: async (ctx, input) => {
    const stack = ctx?.config?.stack;
    if (typeof stack !== 'string' || stack.length === 0) throw new Error('s2-static-evidence requires ctx.config.stack');
    const adapters = ctx.adapters ?? ctx.staticAdapters ?? getAdaptersForStack(stack);
    if (!Array.isArray(adapters) || adapters.length === 0) {
      const error = new Error(`NO_STATIC_ADAPTERS: no static-analysis adapter supports stack ${stack}`);
      error.code = 'NO_STATIC_ADAPTERS';
      throw error;
    }
    const target = ctx.target ?? input?.target;
    if (typeof target !== 'string' || target.length === 0) throw new Error('s2-static-evidence requires a target scope');

    const batches = await Promise.all(
      adapters.map((adapter) => adapter.run({ rulesets: ctx.config.rulesets ?? [], target })),
    );
    const staticFindings = [];
    for (let adapterIndex = 0; adapterIndex < batches.length; adapterIndex += 1) {
      const batch = batches[adapterIndex];
      if (!Array.isArray(batch)) throw new Error(`Static adapter ${adapters[adapterIndex].name} returned a non-array result`);
      for (let findingIndex = 0; findingIndex < batch.length; findingIndex += 1) {
        validateArtifact(
          STATIC_FINDING_SCHEMA,
          batch[findingIndex],
          `${adapters[adapterIndex].name} StaticFinding[${findingIndex}]`,
        );
        staticFindings.push(batch[findingIndex]);
      }
    }
    return { staticFindings };
  },
});
