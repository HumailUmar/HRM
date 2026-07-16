export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const srcVal = source[key];
      const tgtVal = target[key];
      // If both are objects (non-array, non-null), merge recursively
      if (
        srcVal !== null &&
        typeof srcVal === 'object' &&
        !Array.isArray(srcVal) &&
        tgtVal !== null &&
        typeof tgtVal === 'object' &&
        !Array.isArray(tgtVal)
      ) {
        result[key] = deepMerge(tgtVal, srcVal);
      } else {
        // Otherwise, replace with the source value (including arrays, primitives, null)
        result[key] = srcVal as any;
      }
    }
  }
  return result;
}
