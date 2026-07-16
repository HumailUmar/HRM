import { getColumnLetter, getColumnLetterFromZero } from '../lib/columnUtils';

describe('columnUtils - getColumnLetter & getColumnLetterFromZero', () => {
  describe('getColumnLetter (1-based index)', () => {
    test('converts basic single-letter columns correctly', () => {
      expect(getColumnLetter(1)).toBe('A');
      expect(getColumnLetter(2)).toBe('B');
      expect(getColumnLetter(26)).toBe('Z');
    });

    test('converts double-letter columns correctly', () => {
      expect(getColumnLetter(27)).toBe('AA');
      expect(getColumnLetter(28)).toBe('AB');
      expect(getColumnLetter(52)).toBe('AZ');
      expect(getColumnLetter(53)).toBe('BA');
      expect(getColumnLetter(702)).toBe('ZZ');
    });

    test('converts triple-letter columns correctly', () => {
      expect(getColumnLetter(703)).toBe('AAA');
    });

    test('handles zero or negative inputs safely by returning empty string', () => {
      expect(getColumnLetter(0)).toBe('');
      expect(getColumnLetter(-5)).toBe('');
    });
  });

  describe('getColumnLetterFromZero (0-based index)', () => {
    test('converts 0-based index correctly', () => {
      expect(getColumnLetterFromZero(0)).toBe('A');
      expect(getColumnLetterFromZero(25)).toBe('Z');
      expect(getColumnLetterFromZero(26)).toBe('AA');
      expect(getColumnLetterFromZero(51)).toBe('AZ');
      expect(getColumnLetterFromZero(52)).toBe('BA');
    });
  });
});
