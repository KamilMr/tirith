import React, {createContext, useContext, useState} from 'react';

const TICK_INTERVAL = 1000;
const LiveClockContext = createContext();

export const createLiveClockStore = () => {
  let now = new Date();
  let interval;
  const listeners = new Set();

  const tick = () => {
    now = new Date();
    listeners.forEach(listener => listener());
  };

  const stop = () => {
    if (!interval) return;
    clearInterval(interval);
    interval = undefined;
  };

  return {
    getSnapshot: () => now,
    subscribe: listener => {
      listeners.add(listener);

      if (listeners.size === 1) {
        now = new Date();
        interval = setInterval(tick, TICK_INTERVAL);
      }

      let subscribed = true;
      return () => {
        if (!subscribed) return;
        subscribed = false;
        listeners.delete(listener);
        if (listeners.size === 0) stop();
      };
    },
  };
};

export const LiveClockProvider = ({children}) => {
  const [store] = useState(createLiveClockStore);

  return (
    <LiveClockContext.Provider value={store}>
      {children}
    </LiveClockContext.Provider>
  );
};

export const useLiveClock = () => {
  const clock = useContext(LiveClockContext);
  if (!clock)
    throw new Error('useLiveClock must be used within LiveClockProvider');
  return clock;
};
