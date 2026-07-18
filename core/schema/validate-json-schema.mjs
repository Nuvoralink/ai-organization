import fs from 'node:fs';
import path from 'node:path';

function decodePointer(value) {
  return value.replaceAll('~1', '/').replaceAll('~0', '~');
}

function resolvePointer(document, fragment) {
  if (!fragment || fragment === '#') return document;
  return fragment.replace(/^#/u, '').split('/').filter(Boolean).reduce((node, part) => node?.[decodePointer(part)], document);
}

function resolveReference(reference, schemaFile, cache) {
  const [filePart, fragment = ''] = reference.split('#');
  const targetFile = filePart ? path.resolve(path.dirname(schemaFile), filePart) : schemaFile;
  if (!cache.has(targetFile)) cache.set(targetFile, JSON.parse(fs.readFileSync(targetFile, 'utf8')));
  const schema = resolvePointer(cache.get(targetFile), fragment ? `#${fragment}` : '#');
  if (!schema) throw new Error(`Unresolved schema reference: ${reference} from ${schemaFile}`);
  return { schema, schemaFile: targetFile };
}

function typeMatches(value, expected) {
  if (expected === 'null') return value === null;
  if (expected === 'array') return Array.isArray(value);
  if (expected === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  if (expected === 'integer') return Number.isInteger(value);
  return typeof value === expected;
}

function walk(schema, value, location, schemaFile, cache, failures) {
  if (schema.$ref) {
    const resolved = resolveReference(schema.$ref, schemaFile, cache);
    walk(resolved.schema, value, location, resolved.schemaFile, cache, failures);
    return;
  }
  if (Object.hasOwn(schema, 'const') && value !== schema.const) failures.push(`${location}: must equal ${JSON.stringify(schema.const)}`);
  if (schema.enum && !schema.enum.some((candidate) => Object.is(candidate, value))) failures.push(`${location}: value is not in enum`);
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((expected) => typeMatches(value, expected))) {
      failures.push(`${location}: expected ${types.join('|')}`);
      return;
    }
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) failures.push(`${location}: shorter than minLength ${schema.minLength}`);
    if (schema.pattern && !(new RegExp(schema.pattern, 'u')).test(value)) failures.push(`${location}: does not match ${schema.pattern}`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) failures.push(`${location}: fewer than ${schema.minItems} items`);
    if (schema.uniqueItems) {
      const serialized = value.map((item) => JSON.stringify(item));
      if (new Set(serialized).size !== serialized.length) failures.push(`${location}: items must be unique`);
    }
    if (schema.items) value.forEach((item, index) => walk(schema.items, item, `${location}[${index}]`, schemaFile, cache, failures));
  }
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const required of schema.required ?? []) if (!Object.hasOwn(value, required)) failures.push(`${location}: missing required property ${required}`);
    for (const [key, child] of Object.entries(value)) {
      if (schema.properties?.[key]) walk(schema.properties[key], child, `${location}.${key}`, schemaFile, cache, failures);
      else if (schema.additionalProperties === false) failures.push(`${location}: unexpected property ${key}`);
    }
  }
}

export function validateJsonAgainstSchema(schemaFile, value) {
  const resolvedFile = path.resolve(schemaFile);
  const schema = JSON.parse(fs.readFileSync(resolvedFile, 'utf8'));
  const failures = [];
  walk(schema, value, '$', resolvedFile, new Map([[resolvedFile, schema]]), failures);
  return failures;
}

export function validateSchemaReferences(schemaFile) {
  const resolvedFile = path.resolve(schemaFile);
  const schema = JSON.parse(fs.readFileSync(resolvedFile, 'utf8'));
  const cache = new Map([[resolvedFile, schema]]);
  const failures = [];
  const visit = (node, currentFile) => {
    if (!node || typeof node !== 'object') return;
    if (node.$ref) {
      try {
        const resolved = resolveReference(node.$ref, currentFile, cache);
        visit(resolved.schema, resolved.schemaFile);
      } catch (error) { failures.push(error.message); }
    }
    for (const [key, child] of Object.entries(node)) if (key !== '$ref') visit(child, currentFile);
  };
  visit(schema, resolvedFile);
  return [...new Set(failures)];
}
