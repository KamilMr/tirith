import {beforeEach, describe, expect, it, vi} from 'vitest';

const harness = vi.hoisted(() => ({
  stateIndex: 0,
  taskPricing: {
    taskId: 3,
    hourlyRate: 115,
    earnings: 10,
    currency: 'PLN',
    dateRangeDays: 1,
  },
  liveClientPricing: {
    clientId: 1,
    rangeType: 'daily',
    startDate: '2026-08-18',
    endDate: '2026-08-18',
    earnings: 81.5,
    currency: 'PLN',
    dateRangeDays: 1,
    projectCount: 1,
    taskCount: 1,
    expectedEarnings: 920,
  },
}));

vi.mock('react', async importOriginal => {
  const react = await importOriginal();
  const stateValues = [
    [{id: 1, name: 'SetsApart'}],
    [{id: 2, client_id: 1, name: 'SkyBound'}],
    [],
    {id: 3, project_id: 2, title: '[ADMIN:SU]'},
    [],
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
  default: taskId => ({
    pricing: taskId ? harness.taskPricing : null,
    loading: false,
  }),
}));
vi.mock('../hooks/useEditorBuffer.js', () => ({
  default: () => ({openEditor: vi.fn()}),
}));
vi.mock('../hooks/useLiveClientMetrics.js', () => ({
  default: () => ({metrics: harness.liveClientPricing, loading: false}),
}));
vi.mock('../hooks/useLiveNow.js', () => ({
  default: () => new Date('2026-08-18T10:00:00'),
}));
vi.mock('../hooks/usePeriodSummary.js', () => ({
  default: () => ({summary: null, loading: false}),
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

import Earnings from './Earnings.js';
import KeyValue from './KeyValue.js';
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

describe('task detail pricing', () => {
  beforeEach(() => {
    harness.stateIndex = 0;
  });

  it('keeps current price task-scoped and shows live client earnings for the selected day', () => {
    const view = View({height: 40});

    const taskDetails = findElement(
      view,
      element =>
        element.type === KeyValue && element.props.label === 'Task Details:',
    );
    const currentPrice = taskDetails.props.items.find(
      item => item.key === 'Current Price',
    );
    const earnings = findElement(view, element => element.type === Earnings);

    expect(currentPrice.value).toBe('10 PLN');
    expect(earnings.props.pricing).toBe(harness.liveClientPricing);
    expect(earnings.props.showExpectedEarnings).toBe(false);
  });
});
