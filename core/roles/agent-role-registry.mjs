function rolesFrom(registry, label) {
  if (!registry || !Array.isArray(registry.roles)) throw new TypeError(`${label} must contain a roles array`);
  return registry.roles;
}

function replacementTarget(role, universalIds) {
  if (role.supersedes_universal !== true) return undefined;
  if (typeof role.extends === 'string') return role.extends;
  return universalIds.has(role.id) ? role.id : undefined;
}

export function validateProjectRoleExtensionSemantics(universal, projectExtension) {
  const universalRoles = rolesFrom(universal, 'universal registry');
  const projectRoles = rolesFrom(projectExtension, 'project extension');
  const problems = [];
  const universalIds = new Set();
  for (const role of universalRoles) {
    if (universalIds.has(role.id)) problems.push(`Duplicate universal role id: ${role.id}`);
    universalIds.add(role.id);
  }

  const projectIds = new Set();
  const supersededTargets = new Set();
  for (const role of projectRoles) {
    if (projectIds.has(role.id)) problems.push(`Duplicate project role id: ${role.id}`);
    projectIds.add(role.id);

    if (universalIds.has(role.id) && role.supersedes_universal !== true) {
      problems.push(`Project role redefines universal role without supersedes_universal: ${role.id}`);
    }
    if (role.extends !== undefined && !universalIds.has(role.extends)) {
      problems.push(`Project role extends unknown universal role: ${role.id}/${role.extends}`);
    }
    if (universalIds.has(role.id) && role.extends !== undefined && role.extends !== role.id) {
      problems.push(`Project role cannot replace its own universal id while extending a different role: ${role.id}/${role.extends}`);
    }

    const target = replacementTarget(role, universalIds);
    if (role.supersedes_universal === true && target === undefined) {
      problems.push(`Project role supersedes no universal role: ${role.id}`);
    } else if (target !== undefined) {
      if (supersededTargets.has(target)) problems.push(`Multiple project roles supersede universal role: ${target}`);
      supersededTargets.add(target);
    }
  }
  return problems;
}

function normalizedProjectRole(role) {
  const { extends: _extends, supersedes_universal: _supersedesUniversal, ...effectiveRole } = role;
  return effectiveRole;
}

export function effectiveRoles(universal, projectExtension) {
  const problems = validateProjectRoleExtensionSemantics(universal, projectExtension);
  if (problems.length > 0) throw new Error(`Invalid project role extension:\n${problems.join('\n')}`);

  const universalRoles = rolesFrom(universal, 'universal registry');
  const projectRoles = rolesFrom(projectExtension, 'project extension');
  const universalIds = new Set(universalRoles.map((role) => role.id));
  const supersededTargets = new Set(
    projectRoles
      .map((role) => replacementTarget(role, universalIds))
      .filter((target) => target !== undefined),
  );
  return [
    ...universalRoles.filter((role) => !supersededTargets.has(role.id)),
    ...projectRoles.map(normalizedProjectRole),
  ];
}
