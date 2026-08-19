import React, {memo, useMemo} from 'react';
import {Box, Text} from 'ink';
import useLiveClientMetrics from '../hooks/useLiveClientMetrics.js';
import useLiveNow from '../hooks/useLiveNow.js';
import usePeriodSummary from '../hooks/usePeriodSummary.js';
import usePricing from '../hooks/usePricing.js';
import {calculateEstimatedPrice} from '../services/pricingService.js';
import {
  calculateDuration,
  formatCurrency,
  formatLiveDuration,
  sumEntryDurations,
} from '../utils.js';
import Earnings from './Earnings.js';
import KeyValue from './KeyValue.js';
import PeriodSummary from './PeriodSummary.js';
import WorkTargets from './WorkTargets.js';

export const LiveTaskDuration = memo(function LiveTaskDuration({
  timeEntries,
  taskId,
  estimatedMinutes,
}) {
  const selectedTaskEntries = useMemo(
    () => timeEntries.filter(entry => entry.task_id === taskId),
    [timeEntries, taskId],
  );
  const hasActiveEntry = selectedTaskEntries.some(entry => !entry.end);
  const now = useLiveNow(hasActiveEntry);
  const completedSeconds = useMemo(
    () => sumEntryDurations(selectedTaskEntries),
    [selectedTaskEntries],
  );
  const activeSeconds = selectedTaskEntries.reduce(
    (total, entry) =>
      entry.start && !entry.end
        ? total + Math.max(0, calculateDuration(entry.start, now))
        : total,
    0,
  );
  const totalSeconds = completedSeconds + activeSeconds;
  const estimatedSeconds = estimatedMinutes ? estimatedMinutes * 60 : null;
  const isOvertime = estimatedSeconds && totalSeconds > estimatedSeconds;

  return (
    <Text color={isOvertime ? 'red' : undefined}>
      {formatLiveDuration(totalSeconds, activeSeconds)}
    </Text>
  );
});

const Price = ({value, pricing, loading}) => {
  if (loading && !pricing) return <Text dimColor>Loading...</Text>;
  if (value === null || value === undefined) return <Text dimColor>None</Text>;
  return formatCurrency(value, pricing.currency);
};

export const LiveTaskPricing = memo(function LiveTaskPricing({
  taskId,
  estimatedMinutes,
  startDate,
  endDate,
  reload,
}) {
  const {pricing, loading} = usePricing(
    taskId,
    null,
    null,
    startDate,
    endDate,
    reload,
  );
  const estimatedPrice = calculateEstimatedPrice(
    estimatedMinutes,
    pricing?.hourlyRate,
  );

  return (
    <KeyValue
      label="Value"
      items={[
        {
          key: 'Estimated',
          value: (
            <Price value={estimatedPrice} pricing={pricing} loading={loading} />
          ),
        },
        {
          key: 'Earned',
          value: (
            <Price
              value={pricing?.earnings}
              pricing={pricing}
              loading={loading}
            />
          ),
        },
      ]}
    />
  );
});

const useCurrentClientMetrics = props => {
  const {metrics, loading} = useLiveClientMetrics(props);
  const currentMetrics =
    metrics?.clientId === props.clientId &&
    metrics?.rangeType === props.rangeType &&
    metrics?.startDate === props.startDate &&
    metrics?.endDate === props.endDate
      ? metrics
      : null;

  return {
    metrics: currentMetrics,
    loading: loading && !currentMetrics,
  };
};

export const LiveClientEarnings = memo(function LiveClientEarnings(props) {
  const {metrics, loading} = useCurrentClientMetrics(props);

  return (
    <Earnings
      pricing={metrics}
      loading={loading}
      showExpectedEarnings={false}
    />
  );
});

export const LiveClientDetails = memo(function LiveClientDetails({
  rangeLabel,
  ...metricsProps
}) {
  const {metrics, loading} = useCurrentClientMetrics(metricsProps);

  return (
    <>
      <Box width={30} marginLeft={2}>
        <Earnings pricing={metrics} loading={loading} />
      </Box>
      <Box width={30} marginLeft={2}>
        <WorkTargets
          breakdown={metrics}
          loading={loading}
          rangeLabel={rangeLabel}
        />
      </Box>
    </>
  );
});

export const LivePeriodSummary = memo(function LivePeriodSummary({
  rangeLabel,
  periodLabel,
  compact,
  ...summaryProps
}) {
  const {summary, loading} = usePeriodSummary(summaryProps);

  return (
    <PeriodSummary
      summary={summary}
      loading={loading}
      rangeLabel={rangeLabel}
      periodLabel={periodLabel}
      compact={compact}
    />
  );
});
