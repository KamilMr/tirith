import {beforeEach, describe, expect, it, vi} from 'vitest';

const harness = vi.hoisted(() => ({stateIndex: 0}));

vi.mock('react', async importOriginal => {
  const react = await importOriginal();
  const stateValues = [
    [{id: 1, name: 'SetsApart'}],
    [{id: 2, client_id: 1, name: 'SkyBound'}],
    [],
    {id: 3, project_id: 2, title: '[ADMIN:SU]'},
    [
      {
        id: 10,
        task_id: 3,
        title: '[ADMIN:SU]',
        start: new Date('2026-08-18T09:00:00'),
        end: new Date('2026-08-18T10:00:00'),
      },
      {
        id: 11,
        task_id: 4,
        title: 'Another task',
        start: new Date('2026-08-18T10:00:00'),
        end: new Date('2026-08-18T11:00:00'),
      },
    ],
    null,
    'task',
    0,
    new Date('2026-08-18T10:00:00'),
    'detail',
  ];

  return {
    ...react,
    useEffect: () => {},
    useState: initialValue => {
      const index = harness.stateIndex++;
      const value =
        index < stateValues.length
          ? stateValues[index]
          : typeof initialValue === 'function'
            ? initialValue()
            : initialValue;
      return [value, vi.fn()];
    },
  };
});

vi.mock('../contexts/NavigationContext.js', () => ({
  useNavigation: () => ({
    isViewFocused: true,
    isClientFocused: false,
    isProjectsFocused: false,
    isTasksFocused: false,
    getBorderTitle: () => '[0] View',
  }),
}));

vi.mock('../contexts/DataContext.js', () => ({
  useData: () => ({
    selectedClientId: 1,
    selectedProjectId: 2,
    selectedTaskId: 3,
    reload: 0,
    triggerReload: vi.fn(),
  }),
}));

vi.mock('../hooks/useComponentKeys.js', () => ({useComponentKeys: () => {}}));
vi.mock('../hooks/useScrollableList.js', () => ({
  default: () => ({
    selectedIndex: 0,
    selectNext: vi.fn(),
    selectPrevious: vi.fn(),
  }),
}));
vi.mock('../hooks/useTaskAnalytics.js', () => ({
  default: () => ({analytics: null, loading: false}),
}));
vi.mock('../hooks/usePricing.js', () => ({
  default: taskId => {
    if (taskId) throw new Error('View must not consume live task pricing');
    return {pricing: null, loading: false};
  },
}));
vi.mock('../hooks/useEditorBuffer.js', () => ({
  default: () => ({openEditor: vi.fn()}),
}));
vi.mock('../hooks/useLiveClientMetrics.js', () => ({
  default: () => {
    throw new Error('View must not consume live client metrics');
  },
}));
vi.mock('../hooks/useLiveNow.js', () => ({
  default: () => {
    throw new Error('View must not consume the live clock');
  },
}));
vi.mock('../hooks/usePeriodSummary.js', () => ({
  default: () => {
    throw new Error('View must not consume live period summaries');
  },
}));

vi.mock('./SelectedTaskSummary.js', () => ({
  default: function SelectedTaskSummaryProbe() {
    return null;
  },
}));
vi.mock('./TaskTimeEntries.js', () => ({
  default: function TaskTimeEntriesProbe() {
    return null;
  },
}));
vi.mock('./Earnings.js', () => ({
  default: function EarningsProbe() {
    return null;
  },
}));
vi.mock('./KeyValue.js', () => ({
  default: function KeyValueProbe() {
    return null;
  },
}));
vi.mock('./ViewLiveMetrics.js', () => ({
  LiveTaskDuration: function LiveTaskDurationProbe() {
    return null;
  },
  LiveTaskPricing: function LiveTaskPricingProbe() {
    return null;
  },
  LiveClientEarnings: function LiveClientEarningsProbe() {
    return null;
  },
  LiveClientDetails: function LiveClientDetailsProbe() {
    return null;
  },
  LivePeriodSummary: function LivePeriodSummaryProbe() {
    return null;
  },
}));

import TaskTimeEntries from './TaskTimeEntries.js';
import SelectedTaskSummary from './SelectedTaskSummary.js';
import {LivePeriodSummary} from './ViewLiveMetrics.js';
import View from './view.js';

const findElement = (node, predicate) => {
  if (!node || typeof node !== 'object') return null;
  if (predicate(node)) return node;

  const children = node.props?.children;
  const childList = Array.isArray(children) ? children : [children];
  for (const child of childList) {
    const match = findElement(child, predicate);
    if (match) return match;
  }
  return null;
};

describe('View live metric isolation', () => {
  beforeEach(() => {
    harness.stateIndex = 0;
  });

  it('shows the overall report with selected-task context', () => {
    const view = View({height: 40, width: 70});

    const periodSummary = findElement(
      view,
      element => element.type === LivePeriodSummary,
    );
    const taskSummary = findElement(
      view,
      element => element.type === SelectedTaskSummary,
    );
    const taskSessions = findElement(
      view,
      element => element.type === TaskTimeEntries,
    );

    expect(periodSummary.props).toMatchObject({
      rangeType: 'daily',
      startDate: '2026-08-18',
      endDate: '2026-08-18',
      periodLabel: 'August 18, 2026',
    });
    expect(periodSummary.props.compact).toBe(true);
    expect(taskSummary.props.compact).toBe(true);
    expect(taskSummary.props.timeEntries.map(entry => entry.id)).toEqual([10]);
    expect(taskSessions.props.compact).toBe(true);
    expect(taskSessions.props.timeEntries.map(entry => entry.id)).toEqual([10]);
    expect(taskSessions.props.overlapEntries.map(entry => entry.id)).toEqual([
      10, 11,
    ]);
  });
});
