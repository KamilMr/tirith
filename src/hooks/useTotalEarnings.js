import {useState, useEffect} from 'react';
import pricingService from '../services/pricingService.js';

const useTotalEarnings = (startDate, endDate, reload, client) => {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const clientId = typeof client === 'object' ? client?.id : client;

  useEffect(() => {
    if (!clientId || !startDate || !endDate) {
      setPricing(null);
      return;
    }

    let cancelled = false;

    const fetchPricing = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await pricingService.getClientEarnings(
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
  }, [clientId, startDate, endDate, reload]);

  return {pricing, loading, error};
};

export default useTotalEarnings;
