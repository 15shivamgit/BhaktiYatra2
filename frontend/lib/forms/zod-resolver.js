/**
 * Minimal react-hook-form resolver for Zod 4 schemas (replaces @hookform/resolvers, whose
 * current release has unresolvable peer dependencies).
 * @param {import('zod').ZodType} schema
 * @returns {import('react-hook-form').Resolver}
 */
export function zodResolver(schema) {
  return async (values) => {
    const result = await schema.safeParseAsync(values);
    if (result.success) return { values: result.data, errors: {} };

    const errors = {};
    for (const issue of result.error.issues) {
      const name = issue.path.join('.') || 'root';
      if (!errors[name]) errors[name] = { type: issue.code, message: issue.message };
    }
    return { values: {}, errors };
  };
}

/**
 * Copy API validation details (paths like "body.email") onto form fields.
 * @param {import('react-hook-form').UseFormSetError<any>} setError
 * @param {{ path: string, message: string }[] | undefined} details
 * @param {string[]} fields fields that exist in this form
 * @returns {boolean} true when at least one field error was applied
 */
export function applyServerErrors(setError, details, fields) {
  let applied = false;
  for (const { path, message } of details ?? []) {
    const field = path.replace(/^body\./, '');
    if (fields.includes(field)) {
      setError(field, { type: 'server', message }, { shouldFocus: !applied });
      applied = true;
    }
  }
  return applied;
}
