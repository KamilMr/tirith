const createDateLike = (sourceDate, timestamp) => {
  if (sourceDate?.constructor?.name === 'TZDate' && sourceDate.timeZone) {
    return new sourceDate.constructor(new Date(timestamp), sourceDate.timeZone);
  }

  return new Date(timestamp);
};

const moveDateByMinutes = (date, minutes) => {
  const movedTimestamp = new Date(date).getTime() + minutes * 60 * 1000;
  return createDateLike(date, movedTimestamp);
};

export const moveTimeEntryByMinutes = (entry, minutes) => {
  if (!entry) return null;

  return {
    ...entry,
    start: moveDateByMinutes(entry.start, minutes),
    end: entry.end ? moveDateByMinutes(entry.end, minutes) : entry.end,
  };
};

export const resizeTimeEntryEndByMinutes = (
  entry,
  minutes,
  minimumDurationMinutes = 1,
) => {
  if (!entry) return null;
  if (!entry.end) return entry;

  const minimumEnd = moveDateByMinutes(entry.start, minimumDurationMinutes);
  const resizedEnd = moveDateByMinutes(entry.end, minutes);

  return {
    ...entry,
    end: resizedEnd > minimumEnd ? resizedEnd : minimumEnd,
  };
};
