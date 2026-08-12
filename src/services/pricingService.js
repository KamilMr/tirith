import {
  endOfMonth,
  startOfMonth,
  eachDayOfInterval,
  isWeekend,
  startOfDay,
  differenceInDays,
  parseISO,
} from 'date-fns';
import timeEntryModel from '../models/timeEntry.js';
import taskModel from '../models/task.js';
import projectModel from '../models/project.js';
import clientModel from '../models/client.js';
import clientRateHistory from '../models/clientRateHistory.js';
import {
  calculateDuration,
  retriveYYYYMMDD,
  formatDecimalHoursToHHmm,
} from '../utils.js';

// Find the applicable rate for a given date from sorted rate periods
const findRateForDate = (rates, date) => {
  const dateStr = typeof date === 'string' ? date : retriveYYYYMMDD(date);
  // rates are sorted ascending by effective_from
  // find the last rate where effective_from <= date
  let applicableRate = null;
  for (const rate of rates) {
    const effectiveStr =
      typeof rate.effective_from === 'string'
        ? rate.effective_from.split('T')[0]
        : retriveYYYYMMDD(new Date(rate.effective_from));
    if (effectiveStr <= dateStr) applicableRate = rate;
    else break;
  }
  return applicableRate;
};

// Calculate earnings for entries using rate history
const calculateEntriesEarnings = (entries, rates) => {
  let totalSeconds = 0;
  let totalEarnings = 0;
  let currency = 'PLN';

  for (const entry of entries) {
    if (!entry.end) continue; // Skip active entries

    const duration = calculateDuration(entry.start, entry.end);
    totalSeconds += duration;

    const rate = findRateForDate(rates, entry.start);
    if (rate) {
      const hours = duration / 3600;
      totalEarnings += hours * rate.hourly_rate;
      currency = rate.currency || 'PLN';
    }
  }

  return {totalSeconds, totalEarnings, currency};
};

const getMonthDateRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    startDateStr: retriveYYYYMMDD(startDate),
    endDateStr: retriveYYYYMMDD(endDate),
    daysInMonth: endDate.getDate(),
    currentDay: now.getDate(),
  };
};

const getDaysLeft = () => {
  const today = startOfDay(new Date());
  const monthEnd = endOfMonth(today);
  const days = eachDayOfInterval({start: today, end: monthEnd});
  const workingDays = days.filter(d => !isWeekend(d)).length;

  return {
    workingDays,
    calendarDays: days.length,
    isTodayWorkDay: !isWeekend(today),
  };
};

const getTotalWorkingDaysInMonth = () => {
  const now = new Date();
  const days = eachDayOfInterval({
    start: startOfMonth(now),
    end: endOfMonth(now),
  });
  return days.filter(d => !isWeekend(d)).length;
};

const countWorkingDays = (startDate, endDate) =>
  eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  }).filter(day => !isWeekend(day)).length;

export const computeRangeWorkTarget = ({
  rangeType,
  targetHours,
  dailyTarget,
  totalSeconds,
  startDate,
  endDate,
  today = new Date(),
}) => {
  const worked = totalSeconds / 3600;
  const selectedMonthWorkingDays = countWorkingDays(
    retriveYYYYMMDD(startOfMonth(parseISO(startDate))),
    retriveYYYYMMDD(endOfMonth(parseISO(startDate))),
  );
  const resolvedDailyTarget =
    dailyTarget ||
    (selectedMonthWorkingDays > 0 ? targetHours / selectedMonthWorkingDays : 0);
  const rangeWorkingDays = countWorkingDays(startDate, endDate);

  let target;
  switch (rangeType) {
    case 'daily':
      target = rangeWorkingDays > 0 ? resolvedDailyTarget : 0;
      break;
    case 'weekly':
      target = resolvedDailyTarget * rangeWorkingDays;
      break;
    case 'monthly':
      target = targetHours;
      break;
    case 'yearly':
      target = targetHours * 12;
      break;
    default:
      throw new Error(`Unknown work target range: ${rangeType}`);
  }

  const remaining = Math.max(0, target - worked);
  const todayDate = retriveYYYYMMDD(today);
  const remainingStartDate = todayDate > startDate ? todayDate : startDate;
  const remainingWorkingDays =
    remainingStartDate <= endDate
      ? countWorkingDays(remainingStartDate, endDate)
      : 0;
  const catchupPerWorkDay = rangeType !== 'daily';
  const catchup = catchupPerWorkDay
    ? remainingWorkingDays > 0
      ? remaining / remainingWorkingDays
      : 0
    : remaining;

  return {
    target,
    worked,
    percentage: target > 0 ? Math.round((worked / target) * 100) : 0,
    catchup,
    catchupPerWorkDay,
  };
};

const getClientWorkedTime = async (clientId, startDate, endDate) => {
  const projects = await projectModel.selectByCliId(clientId);
  const todayDate = retriveYYYYMMDD(new Date());
  let totalSeconds = 0;
  let workedTodaySeconds = 0;

  for (const project of projects) {
    const tasks = await taskModel.selectByProjectId(project.id);

    for (const task of tasks) {
      const entries = await timeEntryModel.selectByTaskIdWithDateRange(
        task.id,
        startDate,
        endDate,
      );
      for (const entry of entries) {
        const entryDate = retriveYYYYMMDD(new Date(entry.start));
        if (entry.end) {
          const duration = calculateDuration(entry.start, entry.end);
          totalSeconds += duration;
          if (entryDate === todayDate) workedTodaySeconds += duration;
        } else if (entryDate === todayDate) {
          const activeDuration = calculateDuration(entry.start, new Date());
          totalSeconds += activeDuration;
          workedTodaySeconds += activeDuration;
        }
      }
    }
  }

  return {totalSeconds, workedTodaySeconds};
};

export const computeLiveClientMetrics = (snapshot, now = new Date()) => {
  const activeStartDate = snapshot.activeEntry
    ? retriveYYYYMMDD(snapshot.activeEntry.start)
    : null;
  const hasApplicableActiveEntry =
    snapshot.activeEntry?.clientId === snapshot.clientId &&
    activeStartDate >= snapshot.startDate &&
    activeStartDate <= snapshot.endDate;
  const activeSeconds = hasApplicableActiveEntry
    ? Math.max(0, calculateDuration(snapshot.activeEntry.start, now))
    : 0;
  const totalSeconds = snapshot.completedSeconds + activeSeconds;
  const workTarget = computeRangeWorkTarget({
    rangeType: snapshot.rangeType,
    targetHours: snapshot.targetHours,
    dailyTarget: snapshot.dailyTarget,
    totalSeconds,
    startDate: snapshot.startDate,
    endDate: snapshot.endDate,
    today: now,
  });

  const hasRate = snapshot.hourlyRate !== null;
  const activeEarnings =
    hasApplicableActiveEntry && snapshot.activeEntry.hourlyRate !== null
      ? (activeSeconds / 3600) * snapshot.activeEntry.hourlyRate
      : 0;
  const earnings = hasRate ? snapshot.completedEarnings + activeEarnings : null;
  const remainingTargetHours = Math.max(
    0,
    workTarget.target - workTarget.worked,
  );
  const expectedEarnings = hasRate
    ? earnings + remainingTargetHours * snapshot.hourlyRate
    : null;

  return {
    clientId: snapshot.clientId,
    rangeType: snapshot.rangeType,
    startDate: snapshot.startDate,
    endDate: snapshot.endDate,
    hourlyRate: snapshot.hourlyRate,
    currency: snapshot.currency,
    dateRangeDays: snapshot.dateRangeDays,
    projectCount: snapshot.projectCount,
    taskCount: snapshot.taskCount,
    totalSeconds,
    hours: totalSeconds / 3600,
    earnings,
    expectedEarnings,
    activeSeconds,
    ...workTarget,
  };
};

export const computeMonthlyTarget = ({
  targetHours,
  dailyTarget,
  totalSeconds,
  workedTodaySeconds,
  workingDaysLeft,
  calendarDaysLeft,
  isTodayWorkDay,
  totalWorkingDays,
}) => {
  const workedHours = totalSeconds / 3600;
  const workedTodayHours = workedTodaySeconds / 3600;
  const remainingHours = Math.max(0, targetHours - workedHours);

  // Remaining as of start of day (stable — doesn't change as you work)
  const remainingAtStartOfDay = Math.max(
    0,
    targetHours - (workedHours - workedTodayHours),
  );
  const todayBaseline = dailyTarget
    ? dailyTarget
    : workingDaysLeft > 0
      ? remainingAtStartOfDay / workingDaysLeft
      : 0;

  // Stable while working within baseline, recalculates only when exceeded
  const hasExceededBaseline =
    isTodayWorkDay && workedTodayHours > todayBaseline;
  let hoursPerWorkDay;
  if (hasExceededBaseline) {
    const futureDays = workingDaysLeft - 1;
    hoursPerWorkDay =
      futureDays > 0 ? remainingHours / futureDays : remainingHours;
  } else {
    hoursPerWorkDay =
      workingDaysLeft > 0 ? remainingAtStartOfDay / workingDaysLeft : 0;
  }

  const overflowHours = isTodayWorkDay
    ? Math.max(0, workedTodayHours - todayBaseline)
    : 0;

  return {
    targetHours,
    dailyTarget,
    workedSeconds: totalSeconds,
    workedTodaySeconds,
    workedHours,
    workingDaysLeft,
    calendarDaysLeft,
    remainingHours,
    todayBaselineRaw: todayBaseline,
    hoursPerWorkDay: formatDecimalHoursToHHmm(hoursPerWorkDay),
    hoursPerWorkDayRaw: hoursPerWorkDay,
    overflowHours: formatDecimalHoursToHHmm(overflowHours),
    overflowHoursRaw: overflowHours,
    totalWorkingDays,
    isTodayWorkDay,
  };
};

const pricingService = {
  getTaskEarnings: async (taskId, startDate, endDate) => {
    const days = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;

    const task = await taskModel.selectById(taskId);
    if (!task) return null;

    const project = await projectModel.selectById(task.project_id);
    if (!project) return null;

    const rates = await clientRateHistory.getRatesInRange(
      project.client_id,
      startDate,
      endDate,
    );

    const currentRate = await clientRateHistory.getCurrentRate(
      project.client_id,
    );
    if (!currentRate)
      return {hourlyRate: null, earnings: null, currency: 'PLN'};

    const entries = await timeEntryModel.selectByTaskIdWithDateRange(
      taskId,
      startDate,
      endDate,
    );

    const {totalSeconds, totalEarnings, currency} = calculateEntriesEarnings(
      entries,
      rates,
    );
    const hours = totalSeconds / 3600;

    return {
      hourlyRate: currentRate.hourly_rate,
      totalSeconds,
      hours,
      earnings: totalEarnings,
      currency,
      dateRangeDays: days,
    };
  },

  getProjectEarnings: async (projectId, startDate, endDate) => {
    const days = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;

    const project = await projectModel.selectById(projectId);
    if (!project) return null;

    const rates = await clientRateHistory.getRatesInRange(
      project.client_id,
      startDate,
      endDate,
    );

    const currentRate = await clientRateHistory.getCurrentRate(
      project.client_id,
    );
    if (!currentRate)
      return {hourlyRate: null, earnings: null, currency: 'PLN'};

    const tasks = await taskModel.selectByProjectId(projectId);

    let totalSeconds = 0;
    let totalEarnings = 0;
    let currency = 'PLN';

    for (const task of tasks) {
      const entries = await timeEntryModel.selectByTaskIdWithDateRange(
        task.id,
        startDate,
        endDate,
      );
      const result = calculateEntriesEarnings(entries, rates);
      totalSeconds += result.totalSeconds;
      totalEarnings += result.totalEarnings;
      currency = result.currency;
    }

    return {
      hourlyRate: currentRate.hourly_rate,
      totalSeconds,
      hours: totalSeconds / 3600,
      earnings: totalEarnings,
      currency,
      dateRangeDays: days,
      taskCount: tasks.length,
    };
  },

  getClientEarnings: async (clientId, startDate, endDate) => {
    const days = differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;

    const rates = await clientRateHistory.getRatesInRange(
      clientId,
      startDate,
      endDate,
    );

    const currentRate = await clientRateHistory.getCurrentRate(clientId);
    if (!currentRate)
      return {hourlyRate: null, earnings: null, currency: 'PLN'};

    const projects = await projectModel.selectByCliId(clientId);

    let totalSeconds = 0;
    let totalEarnings = 0;
    let taskCount = 0;

    for (const project of projects) {
      const tasks = await taskModel.selectByProjectId(project.id);
      taskCount += tasks.length;

      for (const task of tasks) {
        const entries = await timeEntryModel.selectByTaskIdWithDateRange(
          task.id,
          startDate,
          endDate,
        );
        const result = calculateEntriesEarnings(entries, rates);
        totalSeconds += result.totalSeconds;
        totalEarnings += result.totalEarnings;
      }
    }

    return {
      hourlyRate: currentRate.hourly_rate,
      totalSeconds,
      hours: totalSeconds / 3600,
      earnings: totalEarnings,
      currency: currentRate.currency || 'PLN',
      dateRangeDays: days,
      projectCount: projects.length,
      taskCount,
    };
  },

  getClientMonthlyTarget: async clientId => {
    // Monthly target calculation with dynamic daily average
    //
    // 10wd, worked 0h:     0/80 ~8:00h/wd          - initial target 8h/day
    // 10wd, worked 8h:     8/80 ~8:00h/wd          - daily duty met, average unchanged
    // 10wd, worked 10h:   10/80 ~7:50h(+02:00h)/wd - worked +2h extra, future average drops
    // 9wd,  worked 0h:    10/80 ~7:50h/wd          - next day, no work, average holds
    // 8wd,  worked 0h:    10/80 ~8:50h/wd          - skipped day, average rises
    // 8wd,  worked 8h:    18/80 ~8:50h/wd          - daily duty met, average unchanged
    // 8wd,  worked 8:50h: 18/80 ~8:50h/wd          - worked exactly the daily goal
    // 8wd,  worked 9:50h: 18/80 ~8:40h(+01:00h)/wd - worked +1h extra, future average drops

    const client = await clientModel.selectById(clientId);
    const targetHours = client?.monthly_hours || 170;
    const dailyTarget = client?.daily_hours
      ? parseFloat(client.daily_hours)
      : null;

    const {startDateStr, endDateStr} = getMonthDateRange();
    const {
      workingDays: workingDaysLeft,
      calendarDays: calendarDaysLeft,
      isTodayWorkDay,
    } = getDaysLeft();
    const totalWorkingDays = getTotalWorkingDaysInMonth();

    const {totalSeconds, workedTodaySeconds} = await getClientWorkedTime(
      clientId,
      startDateStr,
      endDateStr,
    );

    return computeMonthlyTarget({
      targetHours,
      dailyTarget,
      totalSeconds,
      workedTodaySeconds,
      workingDaysLeft,
      calendarDaysLeft,
      isTodayWorkDay,
      totalWorkingDays,
    });
  },

  getClientMetricSnapshot: async (clientId, rangeType, startDate, endDate) => {
    const [client, rates, currentRate, entries, projects, tasks] =
      await Promise.all([
        clientModel.selectById(clientId),
        clientRateHistory.getRatesInRange(clientId, startDate, endDate),
        clientRateHistory.getCurrentRate(clientId),
        timeEntryModel.selectByDateRangeWithTask({
          startDate,
          endDate,
          clientId,
        }),
        projectModel.selectByCliId(clientId),
        taskModel.selectByClientId(clientId),
      ]);
    const completed = calculateEntriesEarnings(entries, rates);
    const activeEntry = entries.find(entry => !entry.end);
    const activeRate = activeEntry
      ? findRateForDate(rates, activeEntry.start)
      : null;

    return {
      clientId,
      rangeType,
      startDate,
      endDate,
      targetHours: client?.monthly_hours || 170,
      dailyTarget: client?.daily_hours ? parseFloat(client.daily_hours) : null,
      completedSeconds: completed.totalSeconds,
      completedEarnings: completed.totalEarnings,
      activeEntry: activeEntry
        ? {
            clientId,
            start: activeEntry.start,
            hourlyRate: activeRate?.hourly_rate ?? null,
          }
        : null,
      hourlyRate: currentRate?.hourly_rate ?? null,
      currency: currentRate?.currency || client?.currency || 'PLN',
      dateRangeDays:
        differenceInDays(parseISO(endDate), parseISO(startDate)) + 1,
      projectCount: projects.length,
      taskCount: tasks.length,
      fetchedAt: new Date(),
    };
  },

  getClientWorkBreakdown: async (clientId, rangeType, startDate, endDate) => {
    const snapshot = await pricingService.getClientMetricSnapshot(
      clientId,
      rangeType,
      startDate,
      endDate,
    );
    return computeLiveClientMetrics(snapshot, snapshot.fetchedAt);
  },
};

export default pricingService;
