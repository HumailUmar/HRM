const isPlainObject = (value: unknown): value is Record<string, any> => {
  if (value === null || typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

/**
 * Deep merge two plain objects.
 * - Plain nested objects are recursively merged.
 * - Arrays are replaced, not concatenated.
 * - Dates are copied by value.
 * - Non-plain objects are replaced wholesale.
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  if (!isPlainObject(target)) return { ...(source as T) };
  if (!isPlainObject(source)) return { ...target };

  const merge = (base: Record<string, any>, patch: Record<string, any>): Record<string, any> => {
    const result: Record<string, any> = { ...base };

    for (const [key, srcVal] of Object.entries(patch)) {
      const tgtVal = result[key];

      if (srcVal instanceof Date) {
        result[key] = new Date(srcVal.getTime());
        continue;
      }

      if (Array.isArray(srcVal)) {
        result[key] = [...srcVal];
        continue;
      }

      if (isPlainObject(srcVal) && isPlainObject(tgtVal)) {
        result[key] = merge(tgtVal, srcVal);
        continue;
      }

      result[key] = srcVal;
    }

    return result;
  };

  return merge(target, source as Record<string, any>) as T;
}
