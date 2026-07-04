import {describe, it, expect} from 'vitest';
import {TZDate} from '@date-fns/tz';
import {
  moveTimeEntryByMinutes,
  resizeTimeEntryEndByMinutes,
} from './timeEntryDraft.js';

const date = value => new Date(`2026-01-27T${value}:00Z`);

describe('moveTimeEntryByMinutes', () => {
  it('moves start and end by the same amount while preserving duration', () => {
    const originalEntry = {
      id: 1,
      start: date('10:00'),
      end: date('11:15'),
    };

    const movedEntry = moveTimeEntryByMinutes(originalEntry, -180);

    expect(movedEntry.start).toEqual(date('07:00'));
    expect(movedEntry.end).toEqual(date('08:15'));
    expect(movedEntry.end - movedEntry.start).toBe(
      originalEntry.end - originalEntry.start,
    );
  });

  it('preserves timezone-aware dates while moving an entry', () => {
    const originalEntry = {
      id: 1,
      start: new TZDate(2026, 0, 27, 10, 0, 0, 'Europe/Warsaw'),
      end: new TZDate(2026, 0, 27, 11, 0, 0, 'Europe/Warsaw'),
    };

    const movedEntry = moveTimeEntryByMinutes(originalEntry, -180);

    expect(movedEntry.start.constructor.name).toBe('TZDate');
    expect(movedEntry.start.timeZone).toBe('Europe/Warsaw');
    expect(movedEntry.start.getHours()).toBe(7);
    expect(movedEntry.end.getHours()).toBe(8);
  });
});

describe('resizeTimeEntryEndByMinutes', () => {
  it('adds time by moving only the end later', () => {
    const originalEntry = {
      id: 1,
      start: date('10:00'),
      end: date('11:00'),
    };

    const resizedEntry = resizeTimeEntryEndByMinutes(originalEntry, 30);

    expect(resizedEntry.start).toEqual(date('10:00'));
    expect(resizedEntry.end).toEqual(date('11:30')); // 60m original + 30m added
  });

  it('reduces time by moving only the end earlier', () => {
    const originalEntry = {
      id: 1,
      start: date('10:00'),
      end: date('11:00'),
    };

    const resizedEntry = resizeTimeEntryEndByMinutes(originalEntry, -30);

    expect(resizedEntry.start).toEqual(date('10:00'));
    expect(resizedEntry.end).toEqual(date('10:30')); // 60m original - 30m removed
  });

  it('keeps at least one minute of duration', () => {
    const originalEntry = {
      id: 1,
      start: date('10:00'),
      end: date('10:10'),
    };

    const resizedEntry = resizeTimeEntryEndByMinutes(originalEntry, -30);

    expect(resizedEntry.start).toEqual(date('10:00'));
    expect(resizedEntry.end).toEqual(date('10:01')); // cannot reduce below 1 minute
  });
});
