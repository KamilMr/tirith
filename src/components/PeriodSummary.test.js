import React from 'react';
import {renderToString} from 'ink';
import {describe, expect, it} from 'vitest';
import PeriodSummary from './PeriodSummary.js';

const summary = {
  activeTaskTitle: 'Report',
  workedSeconds: 5 * 3600,
  targetSeconds: 8 * 3600,
  remainingTargetSeconds: 3 * 3600,
  estimatedSeconds: 7 * 3600,
  remainingEstimatedSeconds: 2 * 3600,
  taskCount: 2,
  activeTaskCount: 1,
  projectCount: 2,
  sessionCount: 3,
  activeDayCount: 2,
  hasUnpricedClients: false,
  moneyTotals: [
    {
      currency: 'PLN',
      earned: 600,
      estimatedPrice: 800,
      atTarget: 1000,
    },
  ],
  clients: [],
};

describe('PeriodSummary', () => {
  it('presents the overall report in clear time, activity, and earnings groups', () => {
    const output = renderToString(
      <PeriodSummary
        summary={summary}
        loading={false}
        rangeLabel="Daily"
        periodLabel="August 19, 2026"
      />,
      {columns: 120},
    );

    expect(output).toContain('Daily Report — August 19, 2026');
    expect(output).toContain('Time');
    expect(output).toContain('Tracked: 5h');
    expect(output).toContain('Activity');
    expect(output).toContain('Tasks: 2');
    expect(output).toContain('Projects: 2');
    expect(output).toContain('Sessions: 3');
    expect(output).toContain('Active Days: 2');
    expect(output).toContain('Earnings');
    expect(output).toContain('Earned PLN: 600 PLN');
    expect(output).toContain('Estimated Value PLN: 800 PLN');
    expect(output).toContain('Target Value PLN: 1000 PLN');
  });
});
