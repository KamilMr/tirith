import React from 'react';
import {renderToString} from 'ink';
import {describe, expect, it} from 'vitest';
import PeriodNavigator from './PeriodNavigator.js';
import RangeSelector from './RangeSelector.js';

const options = [
  {label: 'Daily'},
  {label: 'Weekly'},
  {label: 'Monthly'},
  {label: 'Yearly'},
];

describe('View report controls', () => {
  it('keeps range and period controls compact when help is in the footer', () => {
    const output = renderToString(
      <>
        <RangeSelector
          options={options}
          selectedIndex={0}
          controls={null}
          isFocused
        />
        <PeriodNavigator
          rangeLabel="Daily"
          periodLabel="August 19, 2026"
          controls={null}
        />
      </>,
      {columns: 100},
    );

    expect(output).toContain('Range: [Daily]');
    expect(output).toContain('Daily: [August 19, 2026]');
    expect(output).not.toContain('(');
  });
});
