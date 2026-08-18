import {useCallback, useRef, useSyncExternalStore} from 'react';
import {useLiveClock} from '../contexts/LiveClockContext.js';

const useLiveNow = isRunning => {
  const clock = useLiveClock();
  const idleNow = useRef(new Date());
  const wasRunning = useRef(isRunning);

  if (wasRunning.current !== isRunning) {
    wasRunning.current = isRunning;
    if (!isRunning) idleNow.current = new Date();
  }

  const subscribe = useCallback(
    listener => (isRunning ? clock.subscribe(listener) : () => {}),
    [clock, isRunning],
  );
  const getSnapshot = useCallback(
    () => (isRunning ? clock.getSnapshot() : idleNow.current),
    [clock, isRunning],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};

export default useLiveNow;
