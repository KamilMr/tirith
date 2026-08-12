import {describe, it, expect, afterEach} from 'vitest';
import {
  getTimezone,
  getLocalNow,
  toUTC,
  fromUTC,
  getUTCDateRange,
  sumEntryDurations,
  sumLiveEntryDurations,
} from './utils.js';

describe('time entry duration utilities', () => {
  const completed = {
    start: new Date('2026-03-18T08:00:00Z'),
    end: new Date('2026-03-18T09:00:00Z'),
    project_id: 1,
  };
  const active = {
    start: new Date('2026-03-18T10:00:00Z'),
    end: null,
    project_id: 1,
  };
  const now = new Date('2026-03-18T12:00:00Z');

  it('adds completed and active durations exactly once', () => {
    expect(
      sumLiveEntryDurations([completed, active], {
        now,
        projectId: 1,
        date: '2026-03-18',
      }),
    ).toBe(3 * 3600);
  });

  it('keeps completed-only behavior unchanged for existing callers', () => {
    expect(sumEntryDurations([completed, active])).toBe(3600);
  });

  it('does not add entries from another project or date', () => {
    const otherProject = {...active, project_id: 2};
    const otherDate = {
      ...active,
      start: new Date('2026-03-17T10:00:00Z'),
    };

    expect(
      sumLiveEntryDurations([completed, otherProject, otherDate], {
        now,
        projectId: 1,
        date: '2026-03-18',
      }),
    ).toBe(3600);
  });

  it('does not double-count an active duration after it is stopped and reloaded', () => {
    const stopped = {...active, end: now};

    expect(
      sumLiveEntryDurations([completed, stopped], {
        now: new Date('2026-03-18T13:00:00Z'),
        projectId: 1,
        date: '2026-03-18',
      }),
    ).toBe(3 * 3600);
  });
});

describe('Timezone utilities', () => {
  const originalTimezone = process.env.TIMEZONE;

  afterEach(() => {
    if (originalTimezone) process.env.TIMEZONE = originalTimezone;
    else delete process.env.TIMEZONE;
  });

  describe('getTimezone', () => {
    it('returns TIMEZONE env var when set', () => {
      process.env.TIMEZONE = 'Europe/Warsaw';
      expect(getTimezone()).toBe('Europe/Warsaw');
    });

    it('falls back to system timezone when env not set', () => {
      delete process.env.TIMEZONE;
      const result = getTimezone();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('toUTC', () => {
    it('converts date to UTC string format', () => {
      const date = new Date('2026-01-27T12:30:45Z');
      expect(toUTC(date)).toBe('2026-01-27 12:30:45');
    });

    it('handles date without time', () => {
      const date = new Date('2026-01-27T00:00:00Z');
      expect(toUTC(date)).toBe('2026-01-27 00:00:00');
    });
  });

  describe('fromUTC', () => {
    it('returns null for null input', () => {
      expect(fromUTC(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(fromUTC(undefined)).toBeNull();
    });

    it('converts UTC string to TZDate in specified timezone', () => {
      const utcString = '2026-01-27 12:00:00';
      const result = fromUTC(utcString, 'Europe/Warsaw');

      // Warsaw is UTC+1, so 12:00 UTC = 13:00 Warsaw
      expect(result.getHours()).toBe(13);
      expect(result.getMinutes()).toBe(0);
    });

    it('converts UTC string to TZDate in different timezone', () => {
      const utcString = '2026-01-27 12:00:00';
      const result = fromUTC(utcString, 'America/New_York');

      // New York is UTC-5, so 12:00 UTC = 07:00 New York
      expect(result.getHours()).toBe(7);
      expect(result.getMinutes()).toBe(0);
    });
  });

  describe('getUTCDateRange', () => {
    it('returns correct UTC range for Warsaw timezone', () => {
      // Warsaw is UTC+1 in winter
      // Local 2026-01-27 00:00 Warsaw = 2026-01-26 23:00 UTC
      // Local 2026-01-27 23:59 Warsaw = 2026-01-27 22:59 UTC
      const range = getUTCDateRange('2026-01-27', 'Europe/Warsaw');

      expect(range.start).toBe('2026-01-26 23:00:00');
      expect(range.end).toBe('2026-01-27 22:59:59');
    });

    it('returns correct UTC range for New York timezone', () => {
      // New York is UTC-5 in winter
      // Local 2026-01-27 00:00 NY = 2026-01-27 05:00 UTC
      // Local 2026-01-27 23:59 NY = 2026-01-28 04:59 UTC
      const range = getUTCDateRange('2026-01-27', 'America/New_York');

      expect(range.start).toBe('2026-01-27 05:00:00');
      expect(range.end).toBe('2026-01-28 04:59:59');
    });

    it('returns correct UTC range for UTC timezone', () => {
      const range = getUTCDateRange('2026-01-27', 'UTC');

      expect(range.start).toBe('2026-01-27 00:00:00');
      expect(range.end).toBe('2026-01-27 23:59:59');
    });
  });

  describe('getLocalNow', () => {
    it('returns a TZDate instance', () => {
      const now = getLocalNow('Europe/Warsaw');
      expect(now.constructor.name).toBe('TZDate');
    });

    it('returns time in specified timezone', () => {
      const warsawNow = getLocalNow('Europe/Warsaw');
      const nyNow = getLocalNow('America/New_York');

      // Warsaw is 6 hours ahead of New York
      const diffHours = (warsawNow.getHours() - nyNow.getHours() + 24) % 24;
      expect(diffHours).toBe(6);
    });
  });
});
