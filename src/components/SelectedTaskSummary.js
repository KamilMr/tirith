import React from 'react';
import {Box, Text} from 'ink';
import {
  formatEstimation,
  formatHour,
  formatRelativeTime,
  retriveYYYYMMDD,
} from '../utils.js';
import KeyValue from './KeyValue.js';
import {LiveTaskDuration, LiveTaskPricing} from './ViewLiveMetrics.js';

const SelectedTaskSummary = ({
  task,
  project,
  client,
  timeEntries,
  analytics,
  analyticsLoading,
  startDate,
  endDate,
  reload,
  compact = false,
}) => {
  const isRunning = timeEntries.some(entry => !entry.end);
  const activeDayCount = new Set(
    timeEntries.map(entry => retriveYYYYMMDD(new Date(entry.start))),
  ).size;
  const rangeDayCount = analytics?.meta.dateRangeDays;
  const distribution = analytics?.distribution;
  const activityItems = [
    {key: 'Sessions', value: timeEntries.length},
    {
      key: 'Active Days',
      value: rangeDayCount
        ? `${activeDayCount}/${rangeDayCount}`
        : activeDayCount,
    },
  ];

  if (analyticsLoading) {
    activityItems.push({
      key: 'Insights',
      value: <Text dimColor>Loading...</Text>,
    });
  } else if (distribution) {
    if (distribution.peakHour !== null)
      activityItems.push({
        key: 'Peak',
        value: formatHour(distribution.peakHour),
      });
    if (distribution.deepWorkCount > 0)
      activityItems.push({
        key: 'Deep Work',
        value: <Text color="green">{distribution.deepWorkCount}</Text>,
      });
    if (distribution.lastActivityDate)
      activityItems.push({
        key: 'Last',
        value: formatRelativeTime(distribution.lastActivityDate),
      });
  }

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        Selected Task
      </Text>
      <Box marginTop={1}>
        <Text color={isRunning ? 'yellow' : undefined} bold>
          {isRunning ? '● RUNNING' : 'STOPPED'}
        </Text>
        <Text bold> {task.title}</Text>
      </Box>
      <Text dimColor>
        {project?.name || 'Unknown project'} ·{' '}
        {client?.name || 'Unknown client'}
      </Text>

      <Box flexDirection={compact ? 'column' : 'row'} marginTop={1}>
        <Box width={compact ? undefined : 29}>
          <KeyValue
            label="Time"
            items={[
              {
                key: 'Estimate',
                value: formatEstimation(task.estimated_minutes) || (
                  <Text dimColor>None</Text>
                ),
              },
              {
                key: 'Tracked',
                value: (
                  <LiveTaskDuration
                    timeEntries={timeEntries}
                    taskId={task.id}
                    estimatedMinutes={task.estimated_minutes}
                  />
                ),
              },
            ]}
          />
        </Box>
        <Box
          width={compact ? undefined : 29}
          marginLeft={compact ? 0 : 2}
          marginTop={compact ? 1 : 0}
        >
          <KeyValue label="Activity" items={activityItems} />
        </Box>
        <Box
          flexGrow={1}
          marginLeft={compact ? 0 : 2}
          marginTop={compact ? 1 : 0}
        >
          <LiveTaskPricing
            taskId={task.id}
            estimatedMinutes={task.estimated_minutes}
            startDate={startDate}
            endDate={endDate}
            reload={reload}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default SelectedTaskSummary;
