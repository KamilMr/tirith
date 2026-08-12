import React from 'react';
import {Text} from 'ink';
import KeyValue from './KeyValue.js';
import {formatDecimalHoursToHHmm} from '../utils.js';

const fmt = hours => formatDecimalHoursToHHmm(hours);

const WorkTargets = ({breakdown, loading, rangeLabel}) => {
  if (loading) return <Text dimColor>Loading...</Text>;
  if (!breakdown) return null;

  return (
    <KeyValue
      label="Work Targets:"
      items={[
        {
          key: rangeLabel,
          value: (
            <Text>
              {fmt(breakdown.worked)}
              <Text dimColor> / {fmt(breakdown.target)}</Text> (
              {breakdown.percentage}%)
            </Text>
          ),
        },
        {
          key: 'Catch up',
          value: (
            <Text color={breakdown.catchup > 0 ? 'red' : 'green'}>
              {fmt(breakdown.catchup)}
              {breakdown.catchupPerWorkDay ? ' /wd' : ''}
            </Text>
          ),
        },
      ]}
    />
  );
};

export default WorkTargets;
