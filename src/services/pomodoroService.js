import pomodoroSessionModel from '../models/pomodoroSession.js';
import taskModel from '../models/task.js';
import timeEntryModel from '../models/timeEntry.js';
import {formatTime, getLocalNow, retriveYYYYMMDD} from '../utils.js';
import telegramService from './telegramService.js';

const minuteToMs = minutes => minutes * 60 * 1000;
const secondToMs = seconds => seconds * 1000;
const addMs = (date, ms) => new Date(new Date(date).getTime() + ms);

const WORK_MS = minuteToMs(Number(process.env.POMODORO_WORK_MINUTES) || 25);
const SHORT_BREAK_MS = minuteToMs(
  Number(process.env.POMODORO_SHORT_BREAK_MINUTES) || 5,
);
const LONG_BREAK_MS = minuteToMs(
  Number(process.env.POMODORO_LONG_BREAK_MINUTES) || 20,
);
const BREAK_WARNING_MS = secondToMs(
  Number(process.env.POMODORO_BREAK_WARNING_SECONDS) || 30,
);

let timers = [];
let scheduledSessionId = null;
let scheduledStatus = null;
const listeners = new Set();

const clearTimers = () => {
  for (const timer of timers) clearTimeout(timer);
  timers = [];
  scheduledSessionId = null;
  scheduledStatus = null;
};

const scheduleTimer = (callback, delayMs) => {
  const timer = setTimeout(callback, Math.max(0, delayMs));
  timers.push(timer);
};

const emit = () => {
  for (const listener of listeners) listener();
};

const notify = message => telegramService.sendMessageSafe(message);

const breakLabel = breakType =>
  breakType === 'long' ? '20-minute' : '5-minute';

const getBreakDuration = breakType =>
  breakType === 'long' ? LONG_BREAK_MS : SHORT_BREAK_MS;

const getTaskTitle = async taskId => {
  const task = await taskModel.selectById(taskId);
  return task?.title || 'Unknown task';
};

const maybeSendBreakWarning = async sessionId => {
  const session = await pomodoroSessionModel.selectById(sessionId);
  if (!session || session.status !== 'break' || session.break_warning_sent_at)
    return;

  const taskTitle = await getTaskTitle(session.task_id);
  await pomodoroSessionModel.update({
    id: session.id,
    break_warning_sent_at: getLocalNow(),
  });
  await notify(`Pomodoro break ending in 30 seconds: ${taskTitle}`);
  emit();
};

const completeBreak = async sessionId => {
  const session = await pomodoroSessionModel.selectById(sessionId);
  if (!session || session.status !== 'break') return null;

  const endedAt = session.break_ends_at || getLocalNow();
  await pomodoroSessionModel.update({
    id: session.id,
    status: 'completed',
    break_ended_at: endedAt,
  });

  clearTimers();
  const taskTitle = await getTaskTitle(session.task_id);
  await notify(
    `Pomodoro break ended: ${taskTitle}. Ready for the next session.`,
  );
  emit();
  return pomodoroSessionModel.selectById(session.id);
};

const completeWorkSession = async sessionId => {
  const session = await pomodoroSessionModel.selectById(sessionId);
  if (!session || session.status !== 'work') return null;

  const endedAt = session.work_ends_at || getLocalNow();
  const entry = session.time_entry_id
    ? await timeEntryModel.selectById(session.time_entry_id)
    : null;

  if (entry && !entry.end)
    await timeEntryModel.update({id: entry.id, end: endedAt});

  const breakType = session.session_number % 4 === 0 ? 'long' : 'short';
  const breakEndsAt = addMs(endedAt, getBreakDuration(breakType));

  await pomodoroSessionModel.update({
    id: session.id,
    status: 'break',
    work_ended_at: endedAt,
    break_type: breakType,
    break_started_at: endedAt,
    break_ends_at: breakEndsAt,
  });

  const taskTitle = await getTaskTitle(session.task_id);
  await notify(
    `Pomodoro #${session.session_number} finished: ${taskTitle}. ${breakLabel(
      breakType,
    )} break started.`,
  );

  const updated = await pomodoroSessionModel.selectById(session.id);
  pomodoroService.scheduleActiveSession(updated);
  emit();
  return updated;
};

const pomodoroService = {
  subscribe: listener => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  getActiveSession: () => pomodoroSessionModel.selectActive(),

  startPomodoro: async taskId => {
    const task = await taskModel.selectById(taskId);
    if (!task) throw new Error('Task does not exist');

    const activePomodoro = await pomodoroSessionModel.selectActive();
    if (activePomodoro) await pomodoroService.stopActivePomodoro();

    const now = getLocalNow();
    const activeEntry = await timeEntryModel.selectActiveEntry();
    if (activeEntry)
      await timeEntryModel.update({id: activeEntry.id, end: now});

    const [timeEntryId] = await timeEntryModel.create({taskId, start: now});
    const completedToday = await pomodoroSessionModel.countCompletedOnDate(
      retriveYYYYMMDD(now),
    );
    const sessionNumber = completedToday + 1;
    const workEndsAt = addMs(now, WORK_MS);

    const [sessionId] = await pomodoroSessionModel.create({
      task_id: taskId,
      time_entry_id: timeEntryId,
      status: 'work',
      session_number: sessionNumber,
      work_started_at: now,
      work_ends_at: workEndsAt,
    });

    const session = await pomodoroSessionModel.selectById(sessionId);
    pomodoroService.scheduleActiveSession(session);
    await notify(`Pomodoro #${sessionNumber} started: ${task.title}.`);
    emit();

    return {action: activePomodoro ? 'switched' : 'started', session};
  },

  togglePomodoro: async taskId => {
    const activePomodoro = await pomodoroSessionModel.selectActive();
    if (activePomodoro?.task_id === taskId) {
      const session = await pomodoroService.stopActivePomodoro();
      return {action: 'stopped', session};
    }

    return pomodoroService.startPomodoro(taskId);
  },

  stopActivePomodoro: async () => {
    const session = await pomodoroSessionModel.selectActive();
    if (!session) return null;

    clearTimers();
    const endedAt = getLocalNow();

    if (session.status === 'work' && session.time_entry_id) {
      const entry = await timeEntryModel.selectById(session.time_entry_id);
      if (entry && !entry.end)
        await timeEntryModel.update({id: entry.id, end: endedAt});
    }

    await pomodoroSessionModel.update({
      id: session.id,
      status: 'canceled',
      ...(session.status === 'break' ? {break_ended_at: endedAt} : {}),
    });

    emit();
    return pomodoroSessionModel.selectById(session.id);
  },

  scheduleActiveSession: session => {
    if (!session) return clearTimers();
    if (scheduledSessionId === session.id && scheduledStatus === session.status)
      return;

    clearTimers();
    scheduledSessionId = session.id;
    scheduledStatus = session.status;

    const now = Date.now();

    if (session.status === 'work') {
      scheduleTimer(
        () => completeWorkSession(session.id),
        new Date(session.work_ends_at).getTime() - now,
      );
    }

    if (session.status === 'break') {
      const breakEndTime = new Date(session.break_ends_at).getTime();
      const breakEndDelay = breakEndTime - now;

      if (breakEndDelay <= 0) {
        scheduleTimer(() => completeBreak(session.id), 0);
        return;
      }

      if (!session.break_warning_sent_at) {
        scheduleTimer(
          () => maybeSendBreakWarning(session.id),
          breakEndDelay - BREAK_WARNING_MS,
        );
      }
      scheduleTimer(() => completeBreak(session.id), breakEndDelay);
    }
  },

  ensureScheduled: async () => {
    const active = await pomodoroSessionModel.selectActive();
    pomodoroService.scheduleActiveSession(active);
    return active;
  },

  getActiveStatus: async () => {
    const session = await pomodoroSessionModel.selectActive();
    if (!session) return null;

    const target =
      session.status === 'work' ? session.work_ends_at : session.break_ends_at;
    const remainingSeconds = Math.max(
      0,
      Math.ceil((new Date(target).getTime() - Date.now()) / 1000),
    );
    const taskTitle = await getTaskTitle(session.task_id);

    return {
      id: session.id,
      taskId: session.task_id,
      taskTitle,
      status: session.status,
      sessionNumber: session.session_number,
      breakType: session.break_type,
      remainingSeconds,
      remainingText: formatTime(remainingSeconds) || '0s',
    };
  },

  completeWorkSession,
  completeBreak,
};

export default pomodoroService;
