import {describe, expect, it} from 'vitest';
import {
  createLabeledBarSegments,
  formatProgressBarText,
} from './progressBarLayout.js';

describe('formatProgressBarText', () => {
  it('shows percentage and worked/max hours compactly', () => {
    expect(formatProgressBarText(42.8, 170)).toBe('25% 42h/170h');
  });
});

describe('createLabeledBarSegments', () => {
  it('centers the label within the bar', () => {
    const segments = createLabeledBarSegments({
      text: '25% 42h/170h',
      filled: 5,
      filledColor: 'green',
    });

    expect(segments.map(segment => segment.text).join('')).toBe(
      '    25% 42h/170h    ',
    );
  });

  it('styles text against the background under each character', () => {
    const segments = createLabeledBarSegments({
      text: '50%',
      filled: 10,
      filledColor: 'green',
    });

    expect(segments).toEqual([
      {
        text: '        50',
        backgroundColor: 'green',
        color: 'black',
      },
      {
        text: '%         ',
        backgroundColor: 'gray',
        color: 'white',
      },
    ]);
  });

  it('uses light text on a red filled background', () => {
    const [filledSegment] = createLabeledBarSegments({
      text: '100%',
      filled: 20,
      filledColor: 'red',
    });

    expect(filledSegment.color).toBe('white');
  });

  it('truncates labels that are wider than the bar', () => {
    const segments = createLabeledBarSegments({
      text: '1234567890123456789012345',
      filled: 20,
      filledColor: 'yellow',
    });

    expect(segments.map(segment => segment.text).join('')).toBe(
      '12345678901234567890',
    );
  });
});
