import {useEffect, useMemo, useState} from 'react';
import pricingService, {
  computeLiveClientMetrics,
} from '../services/pricingService.js';
import useLiveNow from './useLiveNow.js';

const RECONCILIATION_INTERVAL = 30000;

const useLiveClientMetrics = ({
  clientId,
  rangeType,
  startDate,
  endDate,
  reload,
}) => {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!clientId || !rangeType || !startDate || !endDate) {
      setSnapshot(null);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const fetchSnapshot = async () => {
      try {
        const nextSnapshot = await pricingService.getClientMetricSnapshot(
          clientId,
          rangeType,
          startDate,
          endDate,
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
  }, [clientId, rangeType, startDate, endDate, reload]);

  const isCurrentSnapshot =
    snapshot?.clientId === clientId &&
    snapshot?.rangeType === rangeType &&
    snapshot?.startDate === startDate &&
    snapshot?.endDate === endDate;
  const now = useLiveNow(Boolean(isCurrentSnapshot && snapshot.activeEntry));
  const metrics = useMemo(
    () =>
      isCurrentSnapshot
        ? computeLiveClientMetrics(
            snapshot,
            snapshot.activeEntry ? now : snapshot.fetchedAt,
          )
        : null,
    [isCurrentSnapshot, snapshot, now],
  );

  return {metrics, loading, error};
};

export default useLiveClientMetrics;
