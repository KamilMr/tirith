import React from 'react';
import {Box, Text} from 'ink';
import KeyValue from './KeyValue.js';
import {formatCurrency, formatEstimation, formatTime} from '../utils.js';

const formatDuration = seconds => formatTime(seconds) || '0s';
const formatEstimate = seconds => formatEstimation(seconds / 60) || '0m';

const PeriodSummary = ({
  summary,
  loading,
  rangeLabel,
  periodLabel,
  compact = false,
}) => {
  if (loading && !summary) return <Text dimColor>Loading summary...</Text>;
  if (!summary) return <Text dimColor>Summary unavailable</Text>;

  const pricingItems = summary.moneyTotals.flatMap(total => [
    {
      key: `Earned ${total.currency}`,
      value: (
        <Text color="green">
          {formatCurrency(total.earned, total.currency)}
        </Text>
      ),
    },
    {
      key: `Should Earn ${total.currency}`,
      value: formatCurrency(total.shouldEarn, total.currency),
    },
  ]);

  if (summary.hasUnpricedClients)
    pricingItems.push({
      key: 'Status',
      value: <Text color="yellow">Some tasks have no rate</Text>,
    });

  const timeItems = [
    {key: 'Worked', value: formatDuration(summary.workedSeconds)},
    {key: 'Target', value: formatDuration(summary.targetSeconds)},
  ];
  if (
    summary.taskWorkedSeconds !== null &&
    summary.taskWorkedSeconds !== undefined
  ) {
    timeItems.push({
      key: 'Task Worked',
      value:
        summary.taskEstimateSeconds === null ? (
          formatDuration(summary.taskWorkedSeconds)
        ) : (
          <Text>
            {formatDuration(summary.taskWorkedSeconds)}
            <Text dimColor>
              {' | '}
              {formatEstimate(summary.taskEstimateSeconds)} estimate
            </Text>
          </Text>
        ),
    });
  }
  if (summary.taskRemainingSeconds !== null)
    timeItems.push({
      key: 'Task Remaining',
      value: formatDuration(summary.taskRemainingSeconds),
    });

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        {rangeLabel} Report{periodLabel ? ` — ${periodLabel}` : ''}
      </Text>
      <Box
        flexDirection={compact ? 'column' : 'row'}
        marginTop={1}
        marginBottom={1}
      >
        <Box width={compact ? undefined : 42}>
          <KeyValue label="Time" items={timeItems} />
        </Box>

        <Box
          width={compact ? undefined : 24}
          marginLeft={compact ? 0 : 2}
          marginTop={compact ? 1 : 0}
        >
          <KeyValue
            label="Activity"
            items={[
              {key: 'Tasks', value: summary.taskCount},
              {key: 'Projects', value: summary.projectCount},
              {key: 'Sessions', value: summary.sessionCount},
              {key: 'Active Days', value: summary.activeDayCount},
              {
                key: 'Running',
                value: summary.activeTaskTitle ? (
                  <Text color="green">{summary.activeTaskTitle}</Text>
                ) : (
                  <Text dimColor>None</Text>
                ),
              },
            ]}
          />
        </Box>

        <Box
          flexGrow={1}
          marginLeft={compact ? 0 : 2}
          marginTop={compact ? 1 : 0}
        >
          {pricingItems.length > 0 ? (
            <KeyValue label="Earnings" items={pricingItems} />
          ) : (
            <KeyValue
              label="Earnings"
              items={[
                {key: 'Status', value: <Text dimColor>No rates set</Text>},
              ]}
            />
          )}
        </Box>
      </Box>

      {summary.clients.length > 0 && (
        <KeyValue
          label="Per Client"
          items={summary.clients.map(client => ({
            key: client.name,
            value: (
              <Text>
                {formatDuration(client.workedSeconds)} tracked
                <Text dimColor>
                  {' '}
                  / {formatDuration(client.targetSeconds)} target
                </Text>
                {' | '}
                {formatDuration(client.estimatedSeconds)} estimated
                {' | '}
                {client.earned === null ? (
                  <Text dimColor>No rate</Text>
                ) : (
                  <Text color="green">
                    {formatCurrency(client.earned, client.currency)}
                  </Text>
                )}
              </Text>
            ),
          }))}
        />
      )}
    </Box>
  );
};

export default PeriodSummary;
