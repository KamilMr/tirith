import {useEffect, useMemo, useState} from 'react';
import periodSummaryService, {
  computePeriodSummary,
} from '../services/periodSummaryService.js';
import useLiveNow from './useLiveNow.js';

const RECONCILIATION_INTERVAL = 30000;

const usePeriodSummary = ({
  rangeType,
  startDate,
  endDate,
  clientId = null,
  taskId = null,
  taskEstimatedMinutes = null,
  reload,
}) => {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!rangeType || !startDate || !endDate || (taskId && !clientId))
      return undefined;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchSnapshot = async () => {
      try {
        const nextSnapshot =
          await periodSummaryService.getPeriodSummarySnapshot(
            rangeType,
            startDate,
            endDate,
            clientId,
            taskId,
            taskEstimatedMinutes,
          );
        if (!cancelled) setSnapshot(nextSnapshot);
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError);
          setSnapshot(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, RECONCILIATION_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [
    rangeType,
    startDate,
    endDate,
    clientId,
    taskId,
    taskEstimatedMinutes,
    reload,
  ]);

  const isCurrentSnapshot =
    snapshot?.rangeType === rangeType &&
    snapshot?.startDate === startDate &&
    snapshot?.endDate === endDate &&
    snapshot?.clientId === clientId &&
    snapshot?.taskId === taskId &&
    snapshot?.taskEstimatedMinutes === taskEstimatedMinutes;
  const currentSnapshot = isCurrentSnapshot ? snapshot : null;
  const now = useLiveNow(
    Boolean(currentSnapshot?.tasks.some(task => task.isActive)),
  );
  const summary = useMemo(
    () => (currentSnapshot ? computePeriodSummary(currentSnapshot, now) : null),
    [currentSnapshot, now],
  );

  return {summary, loading, error};
};

export default usePeriodSummary;
