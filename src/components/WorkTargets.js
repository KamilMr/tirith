import React from 'react';
import {Text} from 'ink';
import KeyValue from './KeyValue.js';
import {formatDecimalHoursToHHmm} from '../utils.js';

const fmt = hours => formatDecimalHoursToHHmm(hours);

const WorkTargets = ({breakdown, loading}) => {
  if (loading) return <Text dimColor>Loading...</Text>;
  if (!breakdown) return null;

  const {monthly, today} = breakdown;
  const paceDelta = today.paceDelta ?? today.catchup ?? 0;
  const paceDeltaItem =
    paceDelta < 0
      ? {
          key: 'Catch up',
          value: <Text color="red">{fmt(Math.abs(paceDelta))}</Text>,
        }
      : paceDelta > 0
        ? {
            key: 'Extra today',
            value: <Text color="green">+{fmt(paceDelta)}</Text>,
          }
        : {
            key: 'Status',
            value: <Text color="green">You are on track :-)</Text>,
          };

  return (
    <KeyValue
      label="Work Targets:"
      items={[
        {
          key: 'Monthly',
          value: (
            <Text>
              {fmt(monthly.worked)}
              <Text dimColor> / {fmt(monthly.target)}</Text> (
              {monthly.percentage}%)
            </Text>
          ),
        },
        {key: 'Today', value: `${fmt(today.worked)} worked`},
        {
          key: 'Pace',
          value: (
            <Text color={today.required > today.target ? 'yellow' : 'green'}>
              ~{fmt(today.required)} /wd
            </Text>
          ),
        },
        {key: 'Target', value: `${fmt(today.target)} /wd`},
        paceDeltaItem,
      ]}
    />
  );
};

export default WorkTargets;
