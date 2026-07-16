/**
 * Convert a 1-based column index to an Excel-style column letter.
 * Example: 1 -> "A", 26 -> "Z", 27 -> "AA"
 * Guards against NaN/Infinity/<=0 to prevent infinite loops or invalid ranges.
 */
export function getColumnLetter(colIndex: number): string {
  if (!Number.isFinite(colIndex) || colIndex <= 0) {
    return '';
  }
  const num = Math.floor(colIndex);
  if (num > 18278) {
    return '';
  }
  let result = '';
  let n = num;
  while (n > 0) {
    const remainder = (n - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

/**
 * Convert a 0-based column index to an Excel-style column letter.
 * Example: 0 -> "A", 25 -> "Z", 26 -> "AA", 51 -> "AZ", 52 -> "BA"
 */
export function getColumnLetterFromZero(zeroBasedIndex: number): string {
  return getColumnLetter(zeroBasedIndex + 1);
}
