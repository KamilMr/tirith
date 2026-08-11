import db from '../db/db.js';
const TABLE = 'task';

const task = {
  listAll: () => db(TABLE).select(),

  listAllWithProject: () =>
    db(TABLE)
      .join('project', 'task.project_id', 'project.id')
      .select('task.*', 'project.name as project_name'),

  create: ({
    title,
    projectId,
    estimatedMinutes = null,
    epic = null,
    category = null,
    isExploration = false,
    scope = null,
  }) =>
    db(TABLE).insert({
      title,
      project_id: projectId,
      estimated_minutes: estimatedMinutes,
      epic,
      category,
      is_exploration: isExploration,
      scope,
    }),

  selectById: id => db(TABLE).select().where('id', id).first(),

  selectByProjectId: projectId =>
    db(TABLE).select().where('project_id', projectId).orderBy('title', 'asc'),

  selectByProjectIdWithActivity: projectId => {
    const activity = db('time_entry')
      .select('task_id')
      .max('start as latest_activity')
      .select(
        db.raw(
          'MAX(CASE WHEN ?? IS NULL THEN 1 ELSE 0 END) as ??',
          ['end', 'is_active'],
        ),
      )
      .groupBy('task_id')
      .as('activity');

    return db(TABLE)
      .leftJoin(activity, 'task.id', 'activity.task_id')
      .select('task.*', 'activity.latest_activity', 'activity.is_active')
      .where('task.project_id', projectId);
  },

  findByTitleAndProject: (title, projectId) =>
    db(TABLE)
      .select()
      .where('title', title)
      .andWhere('project_id', projectId)
      .first(),

  getOrCreate: async ({title, projectId}) => {
    const existing = await task.findByTitleAndProject(title, projectId);
    if (existing) return existing;

    const [id] = await task.create({title, projectId});
    return task.selectById(id);
  },

  getDistinctTaskNamesByProject: projectId =>
    db(TABLE)
      .distinct('title')
      .where('project_id', projectId)
      .orderBy('title', 'asc'),

  update: ({
    id,
    title,
    estimatedMinutes,
    epic,
    category,
    isExploration,
    scope,
  }) => {
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (estimatedMinutes !== undefined)
      updates.estimated_minutes = estimatedMinutes;
    if (epic !== undefined) updates.epic = epic;
    if (category !== undefined) updates.category = category;
    if (isExploration !== undefined) updates.is_exploration = isExploration;
    if (scope !== undefined) updates.scope = scope;
    return db(TABLE).where({id}).update(updates);
  },

  updateMetadata: ({id, epic, category, isExploration, scope}) => {
    const updates = {};
    if (epic !== undefined) updates.epic = epic;
    if (category !== undefined) updates.category = category;
    if (isExploration !== undefined) updates.is_exploration = isExploration;
    if (scope !== undefined) updates.scope = scope;
    return db(TABLE).where({id}).update(updates);
  },

  delete: id => db(TABLE).where('id', id).del(),
};

export default task;
