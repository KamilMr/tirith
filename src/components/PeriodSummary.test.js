import React from 'react';
import {renderToString} from 'ink';
import {describe, expect, it} from 'vitest';
import PeriodSummary from './PeriodSummary.js';

const summary = {
  activeTaskTitle: 'Report',
  workedSeconds: 5 * 3600,
  targetSeconds: 8 * 3600,
  remainingTargetSeconds: 3 * 3600,
  taskWorkedSeconds: 5 * 3600,
  taskEstimateSeconds: 7 * 3600,
  taskRemainingSeconds: 2 * 3600,
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
      shouldEarn: 1000,
    },
  ],
  clients: [
    {
      name: 'SetsApart',
      workedSeconds: 5 * 3600,
      targetSeconds: 8 * 3600,
      estimatedSeconds: 16 * 3600,
      earned: 600,
      currency: 'PLN',
    },
  ],
};

describe('PeriodSummary', () => {
  it('keeps report groups readable in a narrow view', () => {
    const output = renderToString(
      <PeriodSummary
        summary={summary}
        loading={false}
        rangeLabel="Daily"
        periodLabel="August 19, 2026"
        compact
      />,
      {columns: 50},
    );

    expect(output).toContain('Daily Report — August 19, 2026');
    expect(output).toContain('Time');
    expect(output).toContain('Worked: 5h');
    expect(output).toContain('Target: 8h');
    expect(output).toContain('Task Worked: 5h 0m 0s | 7h estimate');
    expect(output).toContain('Task Remaining: 2h');
    expect(output).not.toContain('Task Estimate:');
    expect(output).not.toContain('Target Remaining');
    expect(output).toContain('Activity');
    expect(output).toContain('Tasks: 2');
    expect(output).toContain('Projects: 2');
    expect(output).toContain('Sessions: 3');
    expect(output).toContain('Active Days: 2');
    expect(output).toContain('Earnings');
    expect(output).toContain('Earned PLN: 600 PLN');
    expect(output).toContain('Should Earn PLN: 1000 PLN');
    expect(output).not.toContain('Per Client');
    expect(output).not.toContain('SetsApart');
    expect(output).not.toContain('Estimated Value');
    expect(output).not.toContain('Target Value');
  });

  it('keeps the task estimate visible in the regular layout', () => {
    const output = renderToString(
      <PeriodSummary
        summary={summary}
        loading={false}
        rangeLabel="Daily"
        periodLabel="August 19, 2026"
      />,
      {columns: 120},
    );

    expect(output).toContain('Task Worked: 5h 0m 0s | 7h estimate');
  });

  it('shows task worked without remaining time when no estimate exists', () => {
    const output = renderToString(
      <PeriodSummary
        summary={{
          ...summary,
          taskWorkedSeconds: 3 * 3600,
          taskEstimateSeconds: null,
          taskRemainingSeconds: null,
        }}
        loading={false}
        rangeLabel="Daily"
        periodLabel="August 19, 2026"
        compact
      />,
      {columns: 50},
    );

    expect(output).toContain('Task Worked: 3h 0m 0s');
    expect(output).not.toContain('estimate');
    expect(output).not.toContain('Task Remaining');
  });
});
