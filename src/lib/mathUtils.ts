const isFiniteNumber = (n: unknown): n is number =>
  typeof n === 'number' && Number.isFinite(n);

export const safeAverage = (arr: number[]): number => {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const valid = arr.filter(isFiniteNumber);
  if (valid.length === 0) return 0;
  const sum = valid.reduce((a, b) => a + b, 0);
  return sum / valid.length;
};

export const safeSum = (arr: number[]): number => {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  return arr.filter(isFiniteNumber).reduce((a, b) => a + b, 0);
};
