import {useEffect, useState} from 'react';
import pomodoroService from '../services/pomodoroService.js';

const usePomodoroStatus = () => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadStatus = async () => {
      await pomodoroService.ensureScheduled();
      const activeStatus = await pomodoroService.getActiveStatus();
      if (mounted) setStatus(activeStatus);
    };

    loadStatus();
    const unsubscribe = pomodoroService.subscribe(loadStatus);
    const interval = setInterval(loadStatus, 1000);

    return () => {
      mounted = false;
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return status;
};

export default usePomodoroStatus;
