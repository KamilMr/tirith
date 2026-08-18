import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

const harness = vi.hoisted(() => ({
  clock: null,
  refIndex: 0,
  refs: [],
}));

vi.mock('react', () => ({
  useCallback: callback => callback,
  useRef: initialValue => {
    const index = harness.refIndex++;
    if (!harness.refs[index]) harness.refs[index] = {current: initialValue};
    return harness.refs[index];
  },
  useSyncExternalStore: (subscribe, getSnapshot) => {
    const unsubscribe = subscribe(() => {});
    unsubscribe();
    return getSnapshot();
  },
}));

vi.mock('../contexts/LiveClockContext.js', () => ({
  useLiveClock: () => harness.clock,
}));

import useLiveNow from './useLiveNow.js';

const renderHook = isRunning => {
  harness.refIndex = 0;
  return useLiveNow(isRunning);
};

describe('useLiveNow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-18T10:00:00.000Z'));
    harness.refs = [];
    harness.clock = {
      getSnapshot: vi.fn(() => new Date('2026-08-18T09:00:00.000Z')),
      subscribe: vi.fn(() => () => {}),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps a disabled consumer stable without subscribing to shared ticks', () => {
    const initialNow = renderHook(false);

    vi.advanceTimersByTime(5000);
    const laterNow = renderHook(false);

    expect(laterNow).toBe(initialNow);
    expect(harness.clock.subscribe).not.toHaveBeenCalled();
  });

  it('subscribes an enabled consumer to the shared snapshot', () => {
    const now = renderHook(true);

    expect(harness.clock.subscribe).toHaveBeenCalledOnce();
    expect(now).toEqual(new Date('2026-08-18T09:00:00.000Z'));
  });
});
