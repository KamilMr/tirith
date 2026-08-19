import React from 'react';
import {renderToString} from 'ink';
import {beforeEach, describe, expect, it, vi} from 'vitest';

const harness = vi.hoisted(() => ({
  pricing: null,
  clientMetrics: null,
  now: new Date('2026-08-18T10:00:00.000Z'),
}));

vi.mock('../hooks/usePricing.js', () => ({
  default: () => ({pricing: harness.pricing, loading: false}),
}));
vi.mock('../hooks/useLiveClientMetrics.js', () => ({
  default: () => ({metrics: harness.clientMetrics, loading: false}),
}));
vi.mock('../hooks/useLiveNow.js', () => ({
  default: () => harness.now,
}));
vi.mock('../hooks/usePeriodSummary.js', () => ({
  default: () => ({summary: null, loading: false}),
}));

import {
  LiveClientEarnings,
  LiveTaskDuration,
  LiveTaskPricing,
} from './ViewLiveMetrics.js';

describe('View live metric leaves', () => {
  beforeEach(() => {
    harness.pricing = {
      taskId: 3,
      hourlyRate: 115,
      earnings: 10,
      currency: 'PLN',
    };
    harness.clientMetrics = {
      clientId: 1,
      rangeType: 'daily',
      startDate: '2026-08-18',
      endDate: '2026-08-18',
      hourlyRate: 115,
      earnings: 81.5,
      currency: 'PLN',
      dateRangeDays: 1,
      projectCount: 1,
      taskCount: 1,
    };
  });

  it('renders live task duration and task-scoped prices', () => {
    const duration = renderToString(
      <LiveTaskDuration
        timeEntries={[
          {
            id: 1,
            task_id: 3,
            start: new Date('2026-08-18T09:00:00.000Z'),
            end: new Date('2026-08-18T09:30:00.000Z'),
          },
          {
            id: 2,
            task_id: 3,
            start: new Date('2026-08-18T09:59:55.000Z'),
            end: null,
          },
        ]}
        taskId={3}
        estimatedMinutes={60}
      />,
    );
    const pricing = renderToString(
      <LiveTaskPricing
        taskId={3}
        estimatedMinutes={90}
        startDate="2026-08-18"
        endDate="2026-08-18"
        reload={0}
      />,
    );

    expect(duration).toContain('30m 5s (+5s)');
    expect(pricing).toContain('Value');
    expect(pricing).toContain('Estimated: 173 PLN');
    expect(pricing).toContain('Earned: 10 PLN');
  });

  it('keeps task-view client earnings scoped to the selected range', () => {
    const output = renderToString(
      <LiveClientEarnings
        clientId={1}
        rangeType="daily"
        startDate="2026-08-18"
        endDate="2026-08-18"
        reload={0}
      />,
    );

    expect(output).toContain('Earned: 82 PLN');
    expect(output).not.toContain('At target');
  });
});
