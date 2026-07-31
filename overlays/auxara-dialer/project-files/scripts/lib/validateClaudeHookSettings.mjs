export const AUXARA_HOOK_POLICY = Object.freeze({
  settingsArtifact: '.claude/settings.json',
  completionProfilesArtifact: '.ai-organization/completion-profiles.json',
  forbiddenAllowedToolFragments: Object.freeze(['9fab7e35-1142-425d-bd8f-1c7fdeba1c7e']),
  lifecycleHookEvents: Object.freeze([
    'SessionStart',
    'SubagentStart',
    'TaskCreated',
    'TaskCompleted',
    'SubagentStop',
    'PostCompact',
    'SessionEnd',
  ]),
  lifecycleScript: 'claude-lifecycle-hook.mjs',
  postToolUseScript: 'claude-posttooluse-gate.mjs',
});

function commandHooks(registrations) {
  return Array.isArray(registrations)
    ? registrations.flatMap((entry) => (Array.isArray(entry?.hooks) ? entry.hooks : []))
    : [];
}

function isRootedExecHook(hook, script) {
  return (
    hook?.type === 'command' &&
    hook.command === 'node' &&
    Array.isArray(hook.args) &&
    hook.args.length === 1 &&
    hook.args[0] === `\${CLAUDE_PROJECT_DIR}/scripts/${script}`
  );
}

export function validateHookSettings(
  settingsSource,
  completionProfilesSource,
  policy = AUXARA_HOOK_POLICY,
) {
  const errors = [];
  let settings;
  let profileRegistry;
  try {
    settings = JSON.parse(settingsSource);
  } catch (error) {
    errors.push(`${policy.settingsArtifact}: invalid JSON: ${error.message}`);
  }
  try {
    profileRegistry = JSON.parse(completionProfilesSource);
  } catch (error) {
    errors.push(`${policy.completionProfilesArtifact}: invalid JSON: ${error.message}`);
  }
  if (!settings || !profileRegistry) return errors;

  const allowed = Array.isArray(settings?.permissions?.allow) ? settings.permissions.allow : [];
  for (const fragment of policy.forbiddenAllowedToolFragments) {
    if (allowed.some((tool) => typeof tool === 'string' && tool.includes(fragment))) {
      errors.push(
        `${policy.settingsArtifact}: retired active tool allowlist fragment: ${fragment}`,
      );
    }
  }

  const lifecycleHooks = new Map();
  for (const event of policy.lifecycleHookEvents) {
    const registrations = settings.hooks?.[event];
    const hooks = commandHooks(registrations);
    const canonical = hooks.filter((hook) => isRootedExecHook(hook, policy.lifecycleScript));
    if (registrations?.length !== 1 || hooks.length !== 1 || canonical.length !== 1) {
      errors.push(
        `${policy.settingsArtifact}: ${event} must have exactly one rooted exec-form lifecycle hook command`,
      );
    }
    lifecycleHooks.set(event, canonical);
  }

  const postToolUseRegistrations = settings.hooks?.PostToolUse;
  const postToolUseHooks = commandHooks(postToolUseRegistrations);
  const canonicalPostToolUse = postToolUseHooks.filter((hook) =>
    isRootedExecHook(hook, policy.postToolUseScript),
  );
  if (
    postToolUseRegistrations?.length !== 1 ||
    postToolUseRegistrations[0]?.matcher !== 'Edit|Write' ||
    postToolUseHooks.length !== 1 ||
    canonicalPostToolUse.length !== 1
  ) {
    errors.push(
      `${policy.settingsArtifact}: PostToolUse must be Edit|Write with exactly one rooted exec-form post-tool hook command`,
    );
  }

  const completionTimeouts = (lifecycleHooks.get('TaskCompleted') ?? []).map(
    (hook) => hook.timeout,
  );
  if (
    completionTimeouts.length !== 1 ||
    completionTimeouts[0] * 1_000 !== profileRegistry.lifecycle_hook_timeout_ms
  ) {
    errors.push(
      `${policy.settingsArtifact}: TaskCompleted timeout must exactly match the completion profile authority`,
    );
  }
  return errors;
}
