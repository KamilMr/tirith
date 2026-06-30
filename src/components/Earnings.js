import React from 'react';
import {Text} from 'ink';
import KeyValue from './KeyValue.js';
import {formatCurrency, formatHourlyRate} from '../utils.js';

const Earnings = ({pricing, loading}) => {
  if (loading) return <Text dimColor>Loading...</Text>;
  if (!pricing) return null;
  if (!pricing.hourlyRate)
    return (
      <KeyValue
        label="Earnings:"
        items={[{key: 'Status', value: <Text dimColor>No rate set</Text>}]}
      />
    );

  const items = [
    {
      key: 'Rate',
      value: formatHourlyRate(pricing.hourlyRate, pricing.currency),
    },
    ...(pricing.projectCount !== undefined
      ? [{key: 'Projects', value: pricing.projectCount}]
      : []),
    ...(pricing.taskCount !== undefined
      ? [{key: 'Tasks', value: pricing.taskCount}]
      : []),
    {
      key: 'Earned',
      value: (
        <Text color="green">
          {formatCurrency(pricing.earnings, pricing.currency)}
        </Text>
      ),
    },
  ];

  return (
    <KeyValue label={`Earnings (${pricing.dateRangeDays}d):`} items={items} />
  );
};

export default Earnings;
