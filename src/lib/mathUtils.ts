export const safeAverage = (arr: number[]): number => {
  if (!arr || arr.length === 0) return 0;
  const sum = arr.reduce((a, b) => a + b, 0);
  return sum / arr.length;
};

export const safeSum = (arr: number[]): number => {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0);
};
