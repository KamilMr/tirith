import {describe, expect, it} from 'vitest';
import {
  getViewDateRange,
  moveViewPeriod,
  moveViewLevel,
  moveViewRangeIndex,
  formatViewPeriod,
} from './viewRange.js';

describe('getViewDateRange', () => {
  const anchor = new Date(2026, 7, 11, 12);

  it.each([
    ['daily', '2026-08-11', '2026-08-11'],
    ['weekly', '2026-08-10', '2026-08-16'],
    ['monthly', '2026-08-01', '2026-08-31'],
    ['yearly', '2026-01-01', '2026-12-31'],
  ])('returns the full %s calendar period', (type, startDate, endDate) => {
    expect(getViewDateRange(type, anchor)).toEqual({startDate, endDate});
  });
});

describe('moveViewPeriod', () => {
  const anchor = new Date(2026, 7, 11, 12);

  it.each([
    ['daily', 1, '2026-08-12'],
    ['weekly', -1, '2026-08-04'],
    ['monthly', 1, '2026-09-11'],
    ['yearly', -1, '2025-08-11'],
  ])('moves one %s period', (type, direction, expectedDate) => {
    const moved = moveViewPeriod(type, anchor, direction);

    expect(
      [
        moved.getFullYear(),
        String(moved.getMonth() + 1).padStart(2, '0'),
        String(moved.getDate()).padStart(2, '0'),
      ].join('-'),
    ).toBe(expectedDate);
  });
});

describe('moveViewRangeIndex', () => {
  it('moves horizontally through ranges and wraps at both ends', () => {
    expect(moveViewRangeIndex(0, 1)).toBe(1);
    expect(moveViewRangeIndex(3, 1)).toBe(0);
    expect(moveViewRangeIndex(0, -1)).toBe(3);
  });
});

describe('moveViewLevel', () => {
  it('moves down with Enter and up with Escape without leaving the hierarchy', () => {
    expect(moveViewLevel('range', 1)).toBe('period');
    expect(moveViewLevel('period', 1)).toBe('detail');
    expect(moveViewLevel('detail', 1)).toBe('detail');
    expect(moveViewLevel('detail', -1)).toBe('period');
    expect(moveViewLevel('period', -1)).toBe('range');
    expect(moveViewLevel('range', -1)).toBe('range');
  });
});

describe('formatViewPeriod', () => {
  it('makes the active period visible before opening its details', () => {
    const anchor = new Date(2026, 7, 11, 12);

    expect(formatViewPeriod('daily', anchor)).toBe('August 11, 2026');
    expect(formatViewPeriod('weekly', anchor)).toBe(
      'Aug 10, 2026 - Aug 16, 2026',
    );
    expect(formatViewPeriod('monthly', anchor)).toBe('August 2026');
    expect(formatViewPeriod('yearly', anchor)).toBe('2026');
  });
});
