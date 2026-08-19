import React from 'react';
import {Text} from 'ink';
import KeyValue from './KeyValue.js';
import {formatCurrency} from '../utils.js';

const Earnings = ({pricing, loading, showExpectedEarnings = true}) => {
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
    ...(showExpectedEarnings &&
    pricing.expectedEarnings !== undefined &&
    pricing.expectedEarnings !== null
      ? [
          {
            key: 'Should Earn',
            value: formatCurrency(pricing.expectedEarnings, pricing.currency),
          },
        ]
      : []),
  ];

  return (
    <KeyValue label={`Earnings (${pricing.dateRangeDays}d):`} items={items} />
  );
};

export default Earnings;
