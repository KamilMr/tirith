import {describe, it, expect} from 'vitest';
import {formatTimeEntryOverlapSummary} from './timeEntryOverlapSummary.js';

const at = time => {
  const [hour, minute] = time.split(':').map(Number);
  return new Date(2026, 0, 27, hour, minute, 0);
};

describe('formatTimeEntryOverlapSummary', () => {
  it('shows compared task, duration, and current entry start marker', () => {
    const currentEntry = {
      id: 1,
      title: 'Current task',
      start: at('07:59'),
      end: at('08:30'),
    };

    const summary = formatTimeEntryOverlapSummary(
      [
        {
          entry: {id: 2, title: 'Code review'},
          overlapStart: at('07:59'),
          overlapEnd: at('08:00'),
          overlapSeconds: 60,
        },
      ],
      currentEntry,
    );

    expect(summary).toBe('Code review by 1m 0s (s)');
  });

  it('shows compared task, duration, and current entry end marker', () => {
    const currentEntry = {
      id: 1,
      title: 'Current task',
      start: at('07:30'),
      end: at('08:00'),
    };

    const summary = formatTimeEntryOverlapSummary(
      [
        {
          entry: {id: 2, title: 'Code review'},
          overlapStart: at('07:59'),
          overlapEnd: at('08:00'),
          overlapSeconds: 60,
        },
      ],
      currentEntry,
    );

    expect(summary).toBe('Code review by 1m 0s (e)');
  });

  it('shows when more overlaps exist', () => {
    const currentEntry = {
      id: 1,
      title: 'Current task',
      start: at('07:59'),
      end: at('08:30'),
    };

    const summary = formatTimeEntryOverlapSummary(
      [
        {
          entry: {id: 2, title: 'Code review'},
          overlapStart: at('07:59'),
          overlapEnd: at('08:00'),
          overlapSeconds: 60,
        },
        {
          entry: {id: 3, title: 'Planning'},
          overlapStart: at('08:00'),
          overlapEnd: at('08:10'),
          overlapSeconds: 10 * 60,
        },
      ],
      currentEntry,
    );

    expect(summary).toBe('Code review by 1m 0s (s) +1');
  });
});
