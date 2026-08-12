import {useEffect, useState} from 'react';

const useLiveNow = isRunning => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
    if (!isRunning) return undefined;

    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  return now;
};

export default useLiveNow;
