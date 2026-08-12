import {describe, expect, it} from 'vitest';
import {computePeriodSummary} from './periodSummaryService.js';

const h = hours => hours * 3600;

const base = {
  clients: [
    {id: 1, name: 'Atlas'},
    {id: 2, name: 'Beacon'},
  ],
  projects: [
    {id: 10, client_id: 1},
    {id: 20, client_id: 2},
  ],
  tasks: [
    {
      id: 100,
      title: 'Report',
      projectId: 10,
      estimatedMinutes: 300,
      isActive: true,
    },
    {
      id: 200,
      title: 'Review',
      projectId: 20,
      estimatedMinutes: 120,
      isActive: false,
    },
  ],
  metricSnapshots: [
    {
      clientId: 1,
      rangeType: 'weekly',
      startDate: '2026-08-10',
      endDate: '2026-08-16',
      targetHours: 40,
      dailyTarget: 8,
      completedSeconds: h(1),
      completedEarnings: 100,
      activeEntry: {
        clientId: 1,
        start: new Date('2026-08-12T10:00:00Z'),
        hourlyRate: 100,
      },
      hourlyRate: 100,
      currency: 'PLN',
      dateRangeDays: 7,
      projectCount: 1,
      taskCount: 1,
    },
    {
      clientId: 2,
      rangeType: 'weekly',
      startDate: '2026-08-10',
      endDate: '2026-08-16',
      targetHours: 20,
      dailyTarget: 4,
      completedSeconds: h(2),
      completedEarnings: 300,
      activeEntry: null,
      hourlyRate: 150,
      currency: 'PLN',
      dateRangeDays: 7,
      projectCount: 1,
      taskCount: 1,
    },
  ],
};

const now = new Date('2026-08-12T12:00:00Z');

describe('computePeriodSummary', () => {
  it('combines live worked time, targets, estimates, and task counts', () => {
    const summary = computePeriodSummary(base, now);

    expect(summary.workedSeconds).toBe(h(5));
    expect(summary.targetSeconds).toBe(h(60));
    expect(summary.estimatedSeconds).toBe(h(7));
    expect(summary.remainingEstimatedSeconds).toBe(h(2));
    expect(summary.taskCount).toBe(2);
    expect(summary.activeTaskCount).toBe(1);
    expect(summary.activeTaskTitle).toBe('Report');
  });

  it('combines live earnings and estimated prices by currency', () => {
    const summary = computePeriodSummary(base, now);

    expect(summary.moneyTotals).toEqual([
      {
        currency: 'PLN',
        earned: 600,
        estimatedPrice: 800,
        atTarget: 7000,
      },
    ]);
  });

  it('provides a detailed per-client breakdown', () => {
    const summary = computePeriodSummary(base, now);

    expect(summary.clients).toEqual([
      expect.objectContaining({
        clientId: 1,
        name: 'Atlas',
        workedSeconds: h(3),
        targetSeconds: h(40),
        estimatedSeconds: h(5),
        remainingEstimatedSeconds: h(2),
        earned: 300,
        estimatedPrice: 500,
        taskCount: 1,
        activeTaskCount: 1,
      }),
      expect.objectContaining({
        clientId: 2,
        name: 'Beacon',
        workedSeconds: h(2),
        targetSeconds: h(20),
        estimatedSeconds: h(2),
        remainingEstimatedSeconds: 0,
        earned: 300,
        estimatedPrice: 300,
        taskCount: 1,
        activeTaskCount: 0,
      }),
    ]);
  });

  it('keeps different currencies separate and handles clients without rates', () => {
    const summary = computePeriodSummary(
      {
        ...base,
        metricSnapshots: [
          base.metricSnapshots[0],
          {
            ...base.metricSnapshots[1],
            hourlyRate: null,
            currency: 'EUR',
            completedEarnings: 0,
          },
        ],
      },
      now,
    );

    expect(summary.moneyTotals).toEqual([
      {
        currency: 'PLN',
        earned: 300,
        estimatedPrice: 500,
        atTarget: 4000,
      },
    ]);
    expect(summary.clients[1]).toEqual(
      expect.objectContaining({
        earned: null,
        estimatedPrice: null,
        atTarget: null,
      }),
    );
  });
});
