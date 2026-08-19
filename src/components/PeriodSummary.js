import React from 'react';
import {Box, Text} from 'ink';
import KeyValue from './KeyValue.js';
import {formatCurrency, formatTime} from '../utils.js';

const formatDuration = seconds => formatTime(seconds) || '0s';

const PeriodSummary = ({summary, loading, rangeLabel}) => {
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
      key: `Estimated Value ${total.currency}`,
      value: formatCurrency(total.estimatedPrice, total.currency),
    },
    {
      key: `Target Value ${total.currency}`,
      value: formatCurrency(total.atTarget, total.currency),
    },
  ]);

  if (summary.hasUnpricedClients)
    pricingItems.push({
      key: 'Status',
      value: <Text color="yellow">Some tasks have no rate</Text>,
    });

  return (
    <Box flexDirection="column">
      <Text color="cyan" bold>
        {rangeLabel} Report
      </Text>
      <Box flexDirection="row" marginTop={1} marginBottom={1}>
        <Box width={29}>
          <KeyValue
            label="Time"
            items={[
              {key: 'Tracked', value: formatDuration(summary.workedSeconds)},
              {key: 'Target', value: formatDuration(summary.targetSeconds)},
              {
                key: 'Target Remaining',
                value: formatDuration(summary.remainingTargetSeconds),
              },
              {
                key: 'Estimated',
                value: formatDuration(summary.estimatedSeconds),
              },
              {
                key: 'Estimate Remaining',
                value: formatDuration(summary.remainingEstimatedSeconds),
              },
            ]}
          />
        </Box>

        <Box width={24} marginLeft={2}>
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

        <Box flexGrow={1} marginLeft={2}>
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
