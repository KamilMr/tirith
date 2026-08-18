import React, {memo} from 'react';
import {Box, Text} from 'ink';
import {format} from 'date-fns';
import useLiveNow from '../hooks/useLiveNow.js';
import {findTimeEntryOverlaps} from '../services/timeEntryOverlap.js';
import {formatTimeEntryOverlapSummary} from '../services/timeEntryOverlapSummary.js';
import {calculateDuration, formatTime} from '../utils.js';
import ScrollBox from './ScrollBox.js';

const LiveEntryDuration = ({start}) => {
  const now = useLiveNow(true);
  const duration = calculateDuration(start, now);

  return duration > 0 ? formatTime(duration) : '-';
};

const EntryDuration = ({entry}) => {
  if (!entry.end) return <LiveEntryDuration start={entry.start} />;

  const duration = calculateDuration(entry.start, entry.end);
  return duration > 0 ? formatTime(duration) : '-';
};

const TaskTimeEntries = ({
  height,
  timeEntries,
  selectedEntryIndex,
  isViewFocused,
  selectedTaskId,
  draftEntry,
}) => {
  const selectedEntry = timeEntries[selectedEntryIndex];
  const entryBeingChecked = draftEntry || selectedEntry;
  const entryOverlaps = entryBeingChecked?.end
    ? findTimeEntryOverlaps(entryBeingChecked, timeEntries)
    : [];
  const shouldShowOverlapInfo = draftEntry || entryOverlaps.length > 0;

  return (
    <>
      <Text color="cyan" bold>
        Time Entries ({timeEntries.length}):
      </Text>
      {timeEntries.length === 0 ? (
        <Text dimColor marginLeft={2}>
          No time entries
        </Text>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          <Box gap={1}>
            <Box width={2} />
            <Box width={16}>
              <Text bold dimColor>
                Task
              </Text>
            </Box>
            <Box width={19}>
              <Text bold dimColor>
                Start
              </Text>
            </Box>
            <Box width={19}>
              <Text bold dimColor>
                End
              </Text>
            </Box>
            <Box width={20}>
              <Text bold dimColor>
                Duration
              </Text>
            </Box>
            <Text bold dimColor>
              Overlap
            </Text>
          </Box>

          <ScrollBox
            height={Math.max(5, height - 30)}
            selectedIndex={selectedEntryIndex}
          >
            {timeEntries.map((entry, index) => {
              const isCursor = index === selectedEntryIndex && isViewFocused;
              const isSelectedTask = entry.task_id === selectedTaskId;
              const isDraftRow = draftEntry?.id === entry.id;
              const displayEntry = isDraftRow ? draftEntry : entry;
              const color = isDraftRow
                ? 'yellow'
                : isCursor
                  ? 'green'
                  : isSelectedTask
                    ? '#E8A030'
                    : 'white';
              const rowOverlaps = displayEntry.end
                ? findTimeEntryOverlaps(displayEntry, timeEntries)
                : [];
              const overlapSummary = formatTimeEntryOverlapSummary(
                rowOverlaps,
                displayEntry,
              );
              const taskName = (entry.title || '').slice(0, 16);

              return (
                <Box key={entry.id} gap={1}>
                  <Text color={color}>{isCursor ? '• ' : '  '}</Text>
                  <Box width={16}>
                    <Text color={color}>{taskName}</Text>
                  </Box>
                  <Box width={19}>
                    <Text color={color}>
                      {format(displayEntry.start, 'yyyy-MM-dd HH:mm:ss')}
                    </Text>
                  </Box>
                  <Box width={19}>
                    <Text color={color}>
                      {displayEntry.end ? (
                        format(displayEntry.end, 'yyyy-MM-dd HH:mm:ss')
                      ) : (
                        <Text color="yellow">Running...</Text>
                      )}
                    </Text>
                  </Box>
                  <Box width={20}>
                    <Text color={color}>
                      <EntryDuration entry={displayEntry} />
                      {isDraftRow ? ' [draft]' : ''}
                    </Text>
                  </Box>
                  <Text color={rowOverlaps.length > 0 ? 'red' : color}>
                    {overlapSummary ? overlapSummary.slice(0, 40) : '-'}
                  </Text>
                </Box>
              );
            })}
          </ScrollBox>

          {shouldShowOverlapInfo && (
            <Box flexDirection="column" marginTop={1}>
              <Text color={entryOverlaps.length > 0 ? 'red' : 'green'}>
                {entryOverlaps.length > 0
                  ? `${draftEntry ? '⚠ Draft overlaps' : '⚠ Selected entry overlaps'} ${entryOverlaps.length} entr${entryOverlaps.length === 1 ? 'y' : 'ies'}`
                  : '✓ No overlaps'}
              </Text>
              {entryOverlaps.slice(0, 3).map(overlap => (
                <Text key={overlap.entry.id} color="red">
                  {`  - ${(overlap.entry.title || 'Entry').slice(0, 16)} ${format(overlap.entry.start, 'HH:mm')}-${format(overlap.entry.end, 'HH:mm')} by ${formatTime(overlap.overlapSeconds)}`}
                </Text>
              ))}
            </Box>
          )}
        </Box>
      )}
    </>
  );
};

export default memo(TaskTimeEntries);
