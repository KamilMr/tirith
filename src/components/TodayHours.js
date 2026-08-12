import React, {useEffect, useMemo, useState} from 'react';
import {Text} from 'ink';
import taskService from '../services/taskService.js';
import {useData} from '../contexts/DataContext.js';
import useLiveNow from '../hooks/useLiveNow.js';
import {retriveYYYYMMDD, sumLiveEntryDurations} from '../utils.js';

const TodayHours = ({selectedDate, isT1 = false}) => {
  const {selectedProjectId, reload} = useData();
  const [snapshot, setSnapshot] = useState(null);
  const date =
    typeof selectedDate === 'string'
      ? selectedDate
      : retriveYYYYMMDD(selectedDate);
  const isCurrentSnapshot =
    snapshot?.projectId === selectedProjectId && snapshot?.date === date;
  const entries = isCurrentSnapshot ? snapshot.entries : [];
  const now = useLiveNow(entries.some(entry => !entry.end));

  useEffect(() => {
    if (!selectedProjectId) {
      setSnapshot(null);
      return undefined;
    }

    let cancelled = false;
    const loadTodayHours = async () => {
      try {
        const nextEntries = await taskService.getTasksByProjectAndDate(
          selectedProjectId,
          date,
        );
        if (!cancelled)
          setSnapshot({
            projectId: selectedProjectId,
            date,
            entries: nextEntries,
          });
      } catch (error) {
        console.error('Error loading today hours:', error);
      }
    };

    loadTodayHours();
    return () => {
      cancelled = true;
    };
  }, [date, selectedProjectId, reload]);

  const totalSeconds = useMemo(
    () =>
      sumLiveEntryDurations(entries, {
        now,
        projectId: selectedProjectId,
        date,
      }),
    [entries, now, selectedProjectId, date],
  );
  const todayHours = taskService.calculateTimeSpendFromSeconds(
    totalSeconds,
    isT1,
  );

  return (
    <Text>
      ({todayHours.hours}h {todayHours.minutes}m)
    </Text>
  );
};

export default TodayHours;
