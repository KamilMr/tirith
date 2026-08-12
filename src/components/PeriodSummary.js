import React from 'react';
import {Box, Text} from 'ink';
import KeyValue from './KeyValue.js';
import {formatCurrency, formatTime} from '../utils.js';

const formatDuration = seconds => formatTime(seconds) || '0s';

const PeriodSummary = ({summary, loading, rangeLabel}) => {
  if (loading && !summary) return <Text dimColor>Loading summary...</Text>;
  if (!summary) return <Text dimColor>Summary unavailable</Text>;

  const taskValue = `${summary.taskCount} (${summary.activeTaskCount} active)`;
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
      key: `Estimated Price ${total.currency}`,
      value: formatCurrency(total.estimatedPrice, total.currency),
    },
    {
      key: `At Target ${total.currency}`,
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
      <Box flexDirection="row" marginBottom={1}>
        <Box width={34}>
          <KeyValue
            label={`${rangeLabel} Summary:`}
            items={[
              {
                key: 'Active',
                value: summary.activeTaskTitle ? (
                  <Text color="green">{summary.activeTaskTitle}</Text>
                ) : (
                  <Text dimColor>None</Text>
                ),
              },
              {key: 'Worked', value: formatDuration(summary.workedSeconds)},
              {
                key: 'Work Target',
                value: formatDuration(summary.targetSeconds),
              },
              {
                key: 'Remaining Target',
                value: formatDuration(summary.remainingTargetSeconds),
              },
              {
                key: 'Estimated Work',
                value: formatDuration(summary.estimatedSeconds),
              },
              {
                key: 'Remaining Estimate',
                value: formatDuration(summary.remainingEstimatedSeconds),
              },
              {key: 'Tasks', value: taskValue},
            ]}
          />
        </Box>

        <Box width={36} marginLeft={2}>
          {pricingItems.length > 0 ? (
            <KeyValue label="Pricing:" items={pricingItems} />
          ) : (
            <KeyValue
              label="Pricing:"
              items={[
                {key: 'Status', value: <Text dimColor>No rates set</Text>},
              ]}
            />
          )}
        </Box>
      </Box>

      {summary.clients.length > 0 && (
        <KeyValue
          label="Per Client:"
          items={summary.clients.map(client => ({
            key: client.name,
            value: (
              <Text>
                {formatDuration(client.workedSeconds)} worked
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
