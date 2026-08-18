import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createLiveClockStore} from '../contexts/LiveClockContext.js';

describe('shared live clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-18T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('serves every subscriber from one interval and one timestamp per tick', () => {
    const store = createLiveClockStore();
    const firstConsumerTimes = [];
    const secondConsumerTimes = [];

    const unsubscribeFirst = store.subscribe(() => {
      firstConsumerTimes.push(store.getSnapshot());
    });
    const unsubscribeSecond = store.subscribe(() => {
      secondConsumerTimes.push(store.getSnapshot());
    });

    expect(vi.getTimerCount()).toBe(1);

    vi.advanceTimersByTime(1000);

    expect(firstConsumerTimes).toHaveLength(1);
    expect(secondConsumerTimes).toHaveLength(1);
    expect(firstConsumerTimes[0]).toBe(secondConsumerTimes[0]);
    expect(firstConsumerTimes[0]).toEqual(new Date('2026-08-18T10:00:01.000Z'));

    unsubscribeFirst();
    unsubscribeSecond();
  });

  it('stops while unused and restarts without multiplying intervals', () => {
    const store = createLiveClockStore();

    const unsubscribeFirst = store.subscribe(vi.fn());
    const unsubscribeSecond = store.subscribe(vi.fn());
    expect(vi.getTimerCount()).toBe(1);

    unsubscribeFirst();
    expect(vi.getTimerCount()).toBe(1);

    unsubscribeSecond();
    expect(vi.getTimerCount()).toBe(0);

    const unsubscribeRemounted = store.subscribe(vi.fn());
    expect(vi.getTimerCount()).toBe(1);

    unsubscribeRemounted();
    expect(vi.getTimerCount()).toBe(0);
  });
});
