import {describe, expect, it} from 'vitest';
import {getVisibleTaskCount} from './taskListLayout.js';

describe('getVisibleTaskCount', () => {
  it('shows one task in a compact panel', () => {
    expect(getVisibleTaskCount(6)).toBe(1);
  });

  it('uses each available content row for a one-line task item', () => {
    expect(getVisibleTaskCount(11)).toBe(6);
    expect(getVisibleTaskCount(23)).toBe(18);
  });

  it.each([0, 1, 5])(
    'keeps at least the selected task visible at panel height %i',
    panelHeight => {
      expect(getVisibleTaskCount(panelHeight)).toBe(1);
    },
  );
});
