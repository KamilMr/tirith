import db from '../db/db.js';
import {toUTC, fromUTC, getUTCDateRange} from '../utils.js';

const TABLE = 'time_entry';

// Convert date to UTC string for database storage
const _toUTC = date => (date ? toUTC(date) : null);

// Convert single entry dates from UTC to local TZDate
const _convertEntry = entry => {
  if (!entry) return null;
  return {
    ...entry,
    start: fromUTC(entry.start),
    end: fromUTC(entry.end),
  };
};

// Convert array of entries
const _convertEntries = entries => entries.map(_convertEntry);

const timeEntry = {
  create: ({taskId, start, end = null}) =>
    db(TABLE).insert({task_id: taskId, start: _toUTC(start), end: _toUTC(end)}),

  selectById: async id => {
    const entry = await db(TABLE).select().where('id', id).first();
    return _convertEntry(entry);
  },

  selectByTaskId: async taskId => {
    const entries = await db(TABLE).select().where('task_id', taskId);
    return _convertEntries(entries);
  },

  selectByTaskIdWithDateRange: async (taskId, startDate, endDate) => {
    const startRange = getUTCDateRange(startDate);
    const endRange = getUTCDateRange(endDate);
    const entries = await db(TABLE)
      .select()
      .where('task_id', taskId)
      .where('start', '>=', startRange.start)
      .where('start', '<=', endRange.end)
      .orderBy('start', 'asc');
    return _convertEntries(entries);
  },

  selectActiveEntry: async () => {
    const entry = await db(TABLE).select().whereNull('end').first();
    return _convertEntry(entry);
  },

  selectByDate: async date => {
    const {start, end} = getUTCDateRange(date);
    const entries = await db(TABLE)
      .select()
      .where('start', '>=', start)
      .andWhere('start', '<=', end);
    return _convertEntries(entries);
  },

  selectByDateWithTask: async date => {
    const {start, end} = getUTCDateRange(date);
    const entries = await db(TABLE)
      .join('task', 'time_entry.task_id', 'task.id')
      .select(
        'time_entry.id',
        'time_entry.task_id',
        'time_entry.start',
        'time_entry.end',
        'task.title',
        'task.project_id',
        'task.estimated_minutes',
        'task.epic',
        'task.category',
        'task.is_exploration',
        'task.scope',
      )
      .where('time_entry.start', '>=', start)
      .andWhere('time_entry.start', '<=', end);
    return _convertEntries(entries);
  },

  selectByDateRangeWithTask: async ({
    startDate,
    endDate,
    clientId,
    projectId,
  }) => {
    const startRange = getUTCDateRange(startDate);
    const endRange = getUTCDateRange(endDate);
    let query = db(TABLE)
      .join('task', 'time_entry.task_id', 'task.id')
      .join('project', 'task.project_id', 'project.id')
      .select(
        'time_entry.id',
        'time_entry.task_id',
        'time_entry.start',
        'time_entry.end',
        'task.title',
        'task.project_id',
        'task.estimated_minutes',
        'task.epic',
        'task.category',
        'task.is_exploration',
        'task.scope',
      )
      .where('time_entry.start', '>=', startRange.start)
      .andWhere('time_entry.start', '<=', endRange.end)
      .orderBy('time_entry.start', 'asc');

    if (clientId) query = query.where('project.client_id', clientId);
    if (projectId) query = query.where('task.project_id', projectId);
    return _convertEntries(await query);
  },

  update: ({id, start, end}) => {
    const updates = {};
    if (start !== undefined) updates.start = _toUTC(start);
    if (end !== undefined) updates.end = _toUTC(end);
    return db(TABLE).where({id}).update(updates);
  },

  delete: id => db(TABLE).where('id', id).del(),

  getTodayEntriesByProject: async (date, projectId = null) => {
    const {start, end} = getUTCDateRange(date);
    let query = db(TABLE)
      .join('task', 'time_entry.task_id', 'task.id')
      .select('time_entry.start', 'time_entry.end')
      .where('time_entry.start', '>=', start)
      .andWhere('time_entry.start', '<=', end)
      .whereNotNull('time_entry.end');

    if (projectId) query = query.where('task.project_id', projectId);
    const entries = await query;
    return _convertEntries(entries);
  },

  listAll: async () => {
    const entries = await db(TABLE).select();
    return _convertEntries(entries);
  },
};

export default timeEntry;
