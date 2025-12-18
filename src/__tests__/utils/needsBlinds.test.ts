import { describe, expect, test } from 'vitest';
import { needsBlinds } from '../../Game';

describe('needsBlinds', () => {
  test('should return true for a typical flop game variant', () => {
    expect(needsBlinds('NT')).toBe(true);
  });
  test('should return false for stud variants', () => {
    expect(needsBlinds('F7S')).toBe(false);
  });
});
