import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  endOfMonth,
  endOfWeek,
  endOfYear,
  format,
  startOfMonth,
  startOfWeek,
  startOfYear,
} from 'date-fns';

export const VIEW_RANGE_OPTIONS = [
  {label: 'Daily', type: 'daily'},
  {label: 'Weekly', type: 'weekly'},
  {label: 'Monthly', type: 'monthly'},
  {label: 'Yearly', type: 'yearly'},
];

export const VIEW_LEVELS = ['range', 'period', 'detail'];

const periodBounds = (type, anchorDate) => {
  switch (type) {
    case 'daily':
      return {start: anchorDate, end: anchorDate};
    case 'weekly':
      return {
        start: startOfWeek(anchorDate, {weekStartsOn: 1}),
        end: endOfWeek(anchorDate, {weekStartsOn: 1}),
      };
    case 'monthly':
      return {start: startOfMonth(anchorDate), end: endOfMonth(anchorDate)};
    case 'yearly':
      return {start: startOfYear(anchorDate), end: endOfYear(anchorDate)};
    default:
      throw new Error(`Unknown view range: ${type}`);
  }
};

export const getViewDateRange = (type, anchorDate) => {
  const {start, end} = periodBounds(type, anchorDate);
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(end, 'yyyy-MM-dd'),
  };
};

export const moveViewPeriod = (type, anchorDate, direction) => {
  switch (type) {
    case 'daily':
      return addDays(anchorDate, direction);
    case 'weekly':
      return addWeeks(anchorDate, direction);
    case 'monthly':
      return addMonths(anchorDate, direction);
    case 'yearly':
      return addYears(anchorDate, direction);
    default:
      throw new Error(`Unknown view range: ${type}`);
  }
};

export const moveViewLevel = (level, direction) => {
  const currentIndex = VIEW_LEVELS.indexOf(level);
  const nextIndex = Math.max(
    0,
    Math.min(VIEW_LEVELS.length - 1, currentIndex + direction),
  );
  return VIEW_LEVELS[nextIndex];
};

export const formatViewPeriod = (type, anchorDate) => {
  const {start, end} = periodBounds(type, anchorDate);

  switch (type) {
    case 'daily':
      return format(start, 'MMMM d, yyyy');
    case 'weekly':
      return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
    case 'monthly':
      return format(start, 'MMMM yyyy');
    case 'yearly':
      return format(start, 'yyyy');
    default:
      throw new Error(`Unknown view range: ${type}`);
  }
};
