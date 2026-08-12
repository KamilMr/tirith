import {useState, useEffect, useMemo} from 'react';
import pricingService, {
  computeLiveTaskPricing,
} from '../services/pricingService.js';
import useLiveNow from './useLiveNow.js';

const usePricing = (
  taskId,
  projectId,
  clientId,
  startDate,
  endDate,
  reload,
) => {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if ((!taskId && !projectId && !clientId) || !startDate || !endDate) {
      setPricing(null);
      return;
    }

    let cancelled = false;

    const fetchPricing = async () => {
      setLoading(true);
      setError(null);
      try {
        let data = null;
        if (taskId)
          data = await pricingService.getTaskEarnings(
            taskId,
            startDate,
            endDate,
          );
        else if (projectId)
          data = await pricingService.getProjectEarnings(
            projectId,
            startDate,
            endDate,
          );
        else if (clientId)
          data = await pricingService.getClientEarnings(
            clientId,
            startDate,
            endDate,
          );
        if (!cancelled) setPricing(data);
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setPricing(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchPricing();
    return () => {
      cancelled = true;
    };
  }, [taskId, projectId, clientId, startDate, endDate, reload]);

  const isCurrentTaskPricing =
    pricing?.taskId === taskId &&
    pricing?.startDate === startDate &&
    pricing?.endDate === endDate;
  const currentPricing = taskId && !isCurrentTaskPricing ? null : pricing;
  const now = useLiveNow(Boolean(taskId && currentPricing?.activeEntry));
  const livePricing = useMemo(
    () =>
      taskId && currentPricing
        ? computeLiveTaskPricing(currentPricing, now)
        : currentPricing,
    [taskId, currentPricing, now],
  );

  return {pricing: livePricing, loading, error};
};

export default usePricing;
