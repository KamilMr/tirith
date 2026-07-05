import db from '../db/db.js';
import {toUTC, fromUTC, getUTCDateRange} from '../utils.js';

const TABLE = 'pomodoro_session';

const DATE_FIELDS = [
  'work_started_at',
  'work_ends_at',
  'work_ended_at',
  'break_started_at',
  'break_ends_at',
  'break_warning_sent_at',
  'break_ended_at',
  'created_at',
  'updated_at',
];

const _toUTC = date => (date ? toUTC(date) : null);

const _convertSession = session => {
  if (!session) return null;
  return DATE_FIELDS.reduce(
    (acc, field) => ({...acc, [field]: fromUTC(session[field])}),
    {...session},
  );
};

const _convertSessions = sessions => sessions.map(_convertSession);

const mapDates = values => {
  const mapped = {...values};
  for (const field of DATE_FIELDS) {
    if (mapped[field] !== undefined) mapped[field] = _toUTC(mapped[field]);
  }
  return mapped;
};

const pomodoroSession = {
  create: async values => db(TABLE).insert(mapDates(values)),

  selectById: async id => {
    const session = await db(TABLE).select().where('id', id).first();
    return _convertSession(session);
  },

  selectActive: async () => {
    const session = await db(TABLE)
      .select()
      .whereIn('status', ['work', 'break'])
      .orderBy('id', 'desc')
      .first();
    return _convertSession(session);
  },

  update: ({id, ...values}) =>
    db(TABLE)
      .where({id})
      .update({...mapDates(values), updated_at: db.fn.now()}),

  countCompletedOnDate: async date => {
    const {start, end} = getUTCDateRange(date);
    const result = await db(TABLE)
      .whereNotNull('work_ended_at')
      .where('work_ended_at', '>=', start)
      .where('work_ended_at', '<=', end)
      .count({count: '*'});

    return Number(result[0]?.count || 0);
  },

  listByDate: async date => {
    const {start, end} = getUTCDateRange(date);
    const sessions = await db(TABLE)
      .select()
      .where('work_started_at', '>=', start)
      .where('work_started_at', '<=', end)
      .orderBy('work_started_at', 'asc');
    return _convertSessions(sessions);
  },
};

export default pomodoroSession;
