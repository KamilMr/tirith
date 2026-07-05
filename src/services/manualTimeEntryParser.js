import {TZDate} from '@date-fns/tz';
import {getLocalNow, getTimezone} from '../utils.js';

const TIME_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;
const DURATION_RE = /(\d+(?:\.\d+)?)\s*([hm])/g;

const addMinutes = (date, minutes) =>
  new Date(new Date(date).getTime() + minutes * 60 * 1000);

const parseDurationMinutes = input => {
  const normalized = input.trim().toLowerCase();
  if (!normalized) throw new Error('Duration is required');

  let total = 0;
  let matched = '';
  for (const match of normalized.matchAll(DURATION_RE)) {
    const value = Number(match[1]);
    const unit = match[2];
    total += unit === 'h' ? value * 60 : value;
    matched += match[0];
  }

  const withoutMatches = normalized
    .replace(DURATION_RE, '')
    .replace(/\s+/g, '');

  if (withoutMatches || !matched) {
    if (/^\d+$/.test(normalized)) return Number(normalized);
    throw new Error('Use duration like 35m, 1h, or 1h 15m');
  }

  if (total <= 0) throw new Error('Duration must be greater than 0');
  return Math.round(total);
};

const createDateAtTime = (dateStr, timeStr, tz = getTimezone()) => {
  const timeMatch = timeStr.match(TIME_RE);
  if (!timeMatch) throw new Error('Use time in HH:mm format');

  const [year, month, day] = dateStr.split('-').map(Number);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  return new TZDate(year, month - 1, day, hour, minute, 0, tz);
};

export const parseManualTimeEntryInput = ({
  input,
  selectedDate,
  now = getLocalNow(),
}) => {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) throw new Error('Manual time input cannot be empty');

  const tokens = trimmed.split(/\s+/);
  const first = tokens[0];

  if (first === 'now') {
    const durationMinutes = parseDurationMinutes(tokens.slice(1).join(' '));
    const start = now;
    return {
      start,
      end: addMinutes(start, durationMinutes),
      durationMinutes,
      mode: 'forward',
    };
  }

  if (TIME_RE.test(first)) {
    const durationMinutes = parseDurationMinutes(tokens.slice(1).join(' '));
    const start = createDateAtTime(selectedDate, first);
    return {
      start,
      end: addMinutes(start, durationMinutes),
      durationMinutes,
      mode: 'fixed-start',
    };
  }

  const durationMinutes = parseDurationMinutes(trimmed);
  const end = now;
  return {
    start: addMinutes(end, -durationMinutes),
    end,
    durationMinutes,
    mode: 'retrospective',
  };
};
