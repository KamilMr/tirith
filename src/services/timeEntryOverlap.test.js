import {describe, it, expect} from 'vitest';
import {findTimeEntryOverlaps} from './timeEntryOverlap.js';

const at = time => new Date(`2026-01-27T${time}:00Z`);

const entry = (id, start, end) => ({id, start: at(start), end: at(end)});

describe('findTimeEntryOverlaps', () => {
  it('shows which entries would conflict after moving one entry', () => {
    const moved = entry(1, '07:00', '08:00');
    const overlaps = findTimeEntryOverlaps(
      moved,
      entry(1, '10:00', '11:00'), // same entry before move; ignored
      entry(2, '06:00', '07:00'), // touches start; no overlap
      entry(3, '07:30', '08:30'), // overlaps 30m
      entry(4, '08:00', '09:00'), // touches end; no overlap
      entry(5, '07:45', '07:50'), // fully inside moved entry
    );

    const overlappingEntryIds = overlaps.map(overlap => overlap.entry.id);
    expect(overlappingEntryIds).toEqual([3, 5]);

    const overlapDurationsInSeconds = overlaps.map(
      overlap => overlap.overlapSeconds,
    );
    expect(overlapDurationsInSeconds).toEqual([
      30 * 60, // Entry 3 overlaps from 07:30 to 08:00 = 30 minutes
      5 * 60, // Entry 5 overlaps from 07:45 to 07:50 = 5 minutes
    ]);
  });
});
