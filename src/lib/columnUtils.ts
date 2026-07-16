/**
 * Convert a 1-based column index to an Excel-style column letter.
 * Example: 1 -> "A", 26 -> "Z", 27 -> "AA", 52 -> "AZ", 53 -> "BA"
 */
export function getColumnLetter(colIndex: number): string {
  let result = '';
  let num = colIndex;
  while (num > 0) {
    const remainder = (num - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    num = Math.floor((num - 1) / 26);
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
