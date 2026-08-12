import {TZDate} from '@date-fns/tz';
import {
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  differenceInDays,
} from 'date-fns';

// Timezone configuration
export const getTimezone = () =>
  process.env.TIMEZONE || Intl.DateTimeFormat().resolvedOptions().timeZone;

// Get current time in user's timezone
export const getLocalNow = (tz = getTimezone()) => new TZDate(new Date(), tz);

// Convert date to UTC string for database storage (YYYY-MM-DD HH:MM:SS)
export const toUTC = (date = new Date()) => {
  const d = new Date(date);
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

// Convert UTC string from database to TZDate in user's timezone
export const fromUTC = (utcString, tz = getTimezone()) => {
  if (!utcString) return null;
  const utcDate = new Date(utcString + 'Z');
  return new TZDate(utcDate, tz);
};

// Get date boundaries in UTC for a local date (for database queries)
export const getUTCDateRange = (localDateStr, tz = getTimezone()) => {
  const [year, month, day] = localDateStr.split('-').map(Number);
  const startLocal = new TZDate(year, month - 1, day, 0, 0, 0, tz);
  const endLocal = new TZDate(year, month - 1, day, 23, 59, 59, tz);
  return {
    start: toUTC(startLocal),
    end: toUTC(endLocal),
  };
};

const toSnakeCase = str => {
  return str
    .replace(/\s+/g, '_')
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase();
};

const toCamelCase = str => {
  return str.replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
};

export const convToSnake = obj => {
  return Object.keys(obj).reduce((pv, cv) => {
    pv[toSnakeCase(cv)] = obj[cv];
    return pv;
  }, {});
};

export const mapObjToSnake = (obj, keys) => {
  return keys.reduce((pv, cv) => {
    if (!obj[cv]) return pv;

    pv[cv] = obj[cv];
    return pv;
  }, {});
};

export const mapToCamel = obj => {
  return Object.keys(obj).reduce((pv, cv) => {
    pv[toCamelCase(cv)] = obj[cv];
    return pv;
  }, {});
};

export const retriveYYYYMMDD = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDateRange = rangeType => {
  const now = new Date();
  let start, end;

  switch (rangeType) {
    case 'today':
      start = end = now;
      break;
    case 'week':
      start = startOfWeek(now, {weekStartsOn: 1});
      end = now;
      break;
    case 'thisMonth':
      start = startOfMonth(now);
      end = now;
      break;
    case 'prevMonth': {
      const lastMonth = subMonths(now, 1);
      start = startOfMonth(lastMonth);
      end = endOfMonth(lastMonth);
      break;
    }
    case 'all':
      start = subDays(now, 365);
      end = now;
      break;
    default:
      start = end = now;
  }

  return {
    startDate: retriveYYYYMMDD(start),
    endDate: retriveYYYYMMDD(end),
    days: differenceInDays(end, start) + 1,
  };
};

export const getFormatedDate = (now = new Date()) => {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = now.toTimeString().split(' ')[0];
  return `${year}-${month}-${day} ${time}`;
};

export const formatNumbToHHMMss = time => {
  const hours = parseInt(time / (60 * 60), 10);
  const minutes = parseInt((time % (60 * 60)) / 60, 10);
  const seconds = time % 60;

  return `${hours} h ${minutes} min ${seconds} sec`;
};

export const clearTerminal = () => {
  process.stdout.write('\x1Bc'); // This escape character clears the terminal
};

export const convToTss = (date = new Date()) => {
  return Math.floor(new Date(date).getTime() / 1000);
};

export const getDayOfWeek = (date = new Date()) => {
  return date.toLocaleDateString('en-En', {weekday: 'short'});
};

export const formatTime = seconds => {
  if (seconds === 0) return '';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

export const formatEstimation = minutes => {
  if (!minutes) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

// Time calculation utilities
export const calculateDuration = (start, end) => {
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();
  return Math.floor((endTime - startTime) / 1000);
};

export const secondsToTimeObject = totalSeconds => ({
  hours: Math.floor(totalSeconds / 3600),
  minutes: Math.floor((totalSeconds % 3600) / 60),
  seconds: totalSeconds % 60,
  totalSeconds,
});

export const sumEntryDurations = entries => {
  return entries.reduce((total, entry) => {
    if (entry.start && entry.end)
      return total + calculateDuration(entry.start, entry.end);
    return total;
  }, 0);
};

export const sumLiveEntryDurations = (
  entries,
  {now = new Date(), projectId, date} = {},
) =>
  entries.reduce((total, entry) => {
    if (!entry.start) return total;
    if (projectId !== undefined && entry.project_id !== projectId) return total;
    if (date && retriveYYYYMMDD(entry.start) !== date) return total;

    const end = entry.end || now;
    return total + Math.max(0, calculateDuration(entry.start, end));
  }, 0);

// Analytics formatting utilities
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) return null;
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

export const formatTimeDiff = seconds => {
  if (seconds === null || seconds === undefined) return null;
  const abs = Math.abs(seconds);
  const sign = seconds >= 0 ? '+' : '-';
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${sign}${hours}h ${minutes}m`;
  if (hours > 0) return `${sign}${hours}h`;
  if (minutes > 0) return `${sign}${minutes}m`;
  return `${sign}${abs}s`;
};

export const formatRelativeTime = date => {
  if (!date) return null;
  const now = new Date();
  const then = new Date(date);
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 60) return 'just now';
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
  const days = Math.floor(diffSeconds / 86400);
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

export const formatHour = hour => {
  if (hour === null || hour === undefined) return null;
  const nextHour = (hour + 1) % 24;
  const formatH = h => {
    if (h === 0) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
  };
  return `${formatH(hour)}-${formatH(nextHour)}`;
};

export const formatDecimalHoursToHHmm = hours => {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Pricing formatting utilities
export const formatCurrency = (amount, currency = 'PLN') => {
  if (amount === null || amount === undefined) return null;
  return `${Math.round(amount)} ${currency}`;
};

export const formatHourlyRate = (rate, currency = 'PLN') => {
  if (rate === null || rate === undefined) return null;
  return `${rate} ${currency}/h`;
};
