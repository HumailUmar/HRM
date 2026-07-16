/**
 * Deep merge two plain objects. Safely handles Dates, typed instances,
 * arrays (replaced, not merged), and guards against circular references.
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  if (!target || typeof target !== 'object') return { ...(source as T) };
  if (!source || typeof source !== 'object') return target;

  const result: Record<string, any> = { ...target };
  const seen = new WeakSet<object>();

  const merge = (tgt: Record<string, any>, src: Record<string, any>): Record<string, any> => {
    for (const key in src) {
      if (!Object.prototype.hasOwnProperty.call(src, key)) continue;
      const srcVal = (src as any)[key];
      const tgtVal = tgt[key];

      // Dates and other typed instances are copied by value, never field-merged.
      if (srcVal instanceof Date) {
        result[key] = new Date(srcVal.getTime());
        continue;
      }
      if (srcVal !== null && typeof srcVal === 'object' && !Array.isArray(srcVal)) {
        if (tgtVal !== null && typeof tgtVal === 'object' && !Array.isArray(tgtVal)) {
          if (seen.has(srcVal)) continue; // circular ref guard
          seen.add(srcVal);
          result[key] = merge({ ...tgtVal }, srcVal);
          continue;
        }
      }
      // Arrays, primitives, null, and other instances replace wholesale.
      result[key] = srcVal;
    }
    return result as T;
  };

  return merge(result, source as Record<string, any>) as T;
}
