const toMs = value => new Date(value).getTime();

const hasFiniteRange = entry =>
  entry?.start && entry?.end && Number.isFinite(toMs(entry.start)) && Number.isFinite(toMs(entry.end));

/**
 * Pure helper for previewing conflicts while moving/resizing a time entry.
 * Boundaries are end-exclusive: 08:00-09:00 does not overlap 09:00-10:00.
 */
export const findTimeEntryOverlaps = (currentEntry, ...otherEntries) => {
  if (!hasFiniteRange(currentEntry)) return [];

  const currentStart = toMs(currentEntry.start);
  const currentEnd = toMs(currentEntry.end);
  if (currentStart >= currentEnd) return [];

  return otherEntries
    .flat()
    .filter(entry => entry && entry.id !== currentEntry.id && hasFiniteRange(entry))
    .map(entry => {
      const entryStart = toMs(entry.start);
      const entryEnd = toMs(entry.end);
      const overlapStart = Math.max(currentStart, entryStart);
      const overlapEnd = Math.min(currentEnd, entryEnd);

      if (overlapStart >= overlapEnd) return null;

      return {
        entry,
        overlapStart: new Date(overlapStart),
        overlapEnd: new Date(overlapEnd),
        overlapSeconds: Math.floor((overlapEnd - overlapStart) / 1000),
      };
    })
    .filter(Boolean)
    .sort((a, b) => toMs(a.entry.start) - toMs(b.entry.start));
};
