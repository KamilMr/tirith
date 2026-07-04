import {describe, it, expect} from 'vitest';
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
