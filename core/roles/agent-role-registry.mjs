function rolesFrom(registry, label) {
  if (!registry || !Array.isArray(registry.roles)) throw new TypeError(`${label} must contain a roles array`);
  return registry.roles;
}

function agentFileExceptionsFrom(projectExtension, problems) {
  if (projectExtension?.agent_file_exceptions === undefined) return [];
  if (!Array.isArray(projectExtension.agent_file_exceptions)) {
    problems.push('Project extension agent_file_exceptions must be an array');
    return [];
  }
  return projectExtension.agent_file_exceptions;
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
  const universalById = new Map();
  for (const role of universalRoles) {
    if (universalIds.has(role.id)) problems.push(`Duplicate universal role id: ${role.id}`);
    universalIds.add(role.id);
    universalById.set(role.id, role);
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

  const exceptionIds = new Set();
  for (const exception of agentFileExceptionsFrom(projectExtension, problems)) {
    const roleId = exception?.role_id;
    if (typeof roleId !== 'string') {
      problems.push('Project agent-file exception lacks a role_id');
      continue;
    }
    if (exceptionIds.has(roleId)) problems.push(`Duplicate project agent-file exception: ${roleId}`);
    exceptionIds.add(roleId);
    if (!universalIds.has(roleId)) {
      problems.push(`Project agent-file exception names non-universal role: ${roleId}`);
      continue;
    }
    if (supersededTargets.has(roleId)) {
      problems.push(`Project agent-file exception names superseded universal role: ${roleId}`);
      continue;
    }
    if (['orchestrate', 'implement'].includes(universalById.get(roleId)?.mode)) {
      problems.push(`Project agent-file exception is redundant for universal ${universalById.get(roleId).mode} role: ${roleId}`);
    }
  }
  return problems;
}

function normalizedProjectRole(role) {
  const effectiveRole = { ...role };
  delete effectiveRole.extends;
  delete effectiveRole.supersedes_universal;
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
