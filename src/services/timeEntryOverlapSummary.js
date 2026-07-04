import {formatTime} from '../utils.js';

const toMs = value => new Date(value).getTime();

const getCurrentOverlapSide = (overlap, currentEntry) => {
  if (!currentEntry) return '';

  const overlapStart = toMs(overlap.overlapStart);
  const overlapEnd = toMs(overlap.overlapEnd);
  const currentStart = toMs(currentEntry.start);
  const currentEnd = toMs(currentEntry.end);

  const touchesCurrentStart = overlapStart === currentStart;
  const touchesCurrentEnd = overlapEnd === currentEnd;

  if (touchesCurrentStart && touchesCurrentEnd) return 's/e';
  if (touchesCurrentStart) return 's';
  if (touchesCurrentEnd) return 'e';
  return '-';
};

export const formatTimeEntryOverlapSummary = (overlaps, currentEntry) => {
  if (!overlaps || overlaps.length === 0) return '';

  const [firstOverlap, ...remainingOverlaps] = overlaps;
  const taskTitle = firstOverlap.entry.title || 'Entry';
  const overlapDuration = formatTime(firstOverlap.overlapSeconds);
  const overlapSide = getCurrentOverlapSide(firstOverlap, currentEntry);
  const remainingText =
    remainingOverlaps.length > 0 ? ` +${remainingOverlaps.length}` : '';

  return `${taskTitle} by ${overlapDuration} (${overlapSide})${remainingText}`;
};
