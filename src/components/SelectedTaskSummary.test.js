import React from 'react';
import {renderToString, Text} from 'ink';
import {describe, expect, it, vi} from 'vitest';

vi.mock('./ViewLiveMetrics.js', () => ({
  LiveTaskDuration: function LiveTaskDurationProbe() {
    return <Text>1h 30m</Text>;
  },
  LiveTaskPricing: function LiveTaskPricingProbe() {
    return (
      <Text>
        Value{`\n`}Estimated: 1840 PLN{`\n`}Earned: 5 PLN
      </Text>
    );
  },
}));

import SelectedTaskSummary from './SelectedTaskSummary.js';

const task = {
  id: 3,
  title: '[SKB] Integration - many many repos',
  estimated_minutes: 960,
};

const entries = [
  {
    id: 1,
    task_id: 3,
    start: new Date('2026-08-18T09:00:00Z'),
    end: new Date('2026-08-18T10:00:00Z'),
  },
  {
    id: 2,
    task_id: 3,
    start: new Date('2026-08-19T09:00:00Z'),
    end: null,
  },
];

describe('SelectedTaskSummary', () => {
  it('shows selected-task identity, live status, and clearly scoped metrics', () => {
    const output = renderToString(
      <SelectedTaskSummary
        task={task}
        project={{name: 'SkyBound'}}
        client={{name: 'SetsApart'}}
        timeEntries={entries}
        analytics={{
          meta: {dateRangeDays: 7},
          distribution: {
            peakHour: 9,
            deepWorkCount: 1,
            lastActivityDate: new Date('2026-08-18T10:00:00Z'),
          },
        }}
        analyticsLoading={false}
        startDate="2026-08-17"
        endDate="2026-08-23"
        reload={0}
      />,
      {columns: 120},
    );

    expect(output).toContain('Selected Task');
    expect(output).toContain('[SKB] Integration - many many repos');
    expect(output).toContain('RUNNING');
    expect(output).toContain('SkyBound · SetsApart');
    expect(output).toContain('Estimate: 16h');
    expect(output).toContain('Tracked: 1h 30m');
    expect(output).toContain('Sessions: 2');
    expect(output).toContain('Active Days: 2/7');
    expect(output).toContain('Peak: 9 AM-10 AM');
    expect(output).toContain('Deep Work: 1');
    expect(output).toContain('Estimated: 1840 PLN');
    expect(output).toContain('Earned: 5 PLN');
  });
});
