import taskModel from '../models/task.js';
import timeEntryModel from '../models/timeEntry.js';
import projectModel from '../models/project.js';
import {findTimeEntryOverlaps} from './timeEntryOverlap.js';
import {parseManualTimeEntryInput} from './manualTimeEntryParser.js';
import {
  getLocalNow,
  retriveYYYYMMDD,
  calculateDuration,
  sumEntryDurations,
} from '../utils.js';

const VALID_CATEGORIES = [
  'integration',
  'feature',
  'ui',
  'fix',
  'refactor',
  'config',
];
const VALID_SCOPES = ['small', 'medium', 'large'];

const validateMetadata = ({epic, category, scope}) => {
  if (epic !== undefined && epic !== null && epic.length > 100)
    throw new Error('Epic cannot exceed 100 characters');
  if (
    category !== undefined &&
    category !== null &&
    !VALID_CATEGORIES.includes(category)
  )
    throw new Error(
      `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
    );
  if (scope !== undefined && scope !== null && !VALID_SCOPES.includes(scope))
    throw new Error(
      `Invalid scope. Must be one of: ${VALID_SCOPES.join(', ')}`,
    );
};

const prepareManualTimeEntry = async ({input, selectedDate}) => {
  const parsed = parseManualTimeEntryInput({input, selectedDate});
  if (new Date(parsed.start).getTime() >= new Date(parsed.end).getTime())
    throw new Error('End time must be after start time');

  const activeEntry = await timeEntryModel.selectActiveEntry();
  if (
    activeEntry &&
    new Date(parsed.end).getTime() > new Date(activeEntry.start).getTime()
  )
    throw new Error(
      'Stop the active task before adding overlapping manual time',
    );

  const dateStr = retriveYYYYMMDD(parsed.start);
  const entries = await timeEntryModel.selectByDate(dateStr);
  const overlaps = findTimeEntryOverlaps(
    {id: null, start: parsed.start, end: parsed.end},
    entries,
  );

  if (overlaps.length > 0) {
    const overlap = overlaps[0];
    const start = overlap.overlapStart.toTimeString().slice(0, 5);
    const end = overlap.overlapEnd.toTimeString().slice(0, 5);
    throw new Error(`Manual time overlaps existing entry ${start}-${end}`);
  }

  return parsed;
};

const saveManualTimeEntry = async (taskId, parsed) => {
  const [entryId] = await timeEntryModel.create({
    taskId,
    start: parsed.start,
    end: parsed.end,
  });

  return {entryId, taskId, ...parsed};
};

const groupTaskEntries = entries =>
  Object.values(
    entries.reduce((tasks, entry) => {
      const key = entry.task_id;

      if (!tasks[key]) {
        tasks[key] = {
          id: entry.task_id,
          title: entry.title,
          projectId: entry.project_id,
          estimatedMinutes: entry.estimated_minutes,
          epic: entry.epic,
          category: entry.category,
          isExploration: entry.is_exploration,
          scope: entry.scope,
          totalSec: 0,
          segments: [],
        };
      }

      const durationTime = entry.end
        ? calculateDuration(entry.start, entry.end)
        : 0;
      tasks[key].totalSec += durationTime;
      if (!entry.end) tasks[key].isActive = true;

      tasks[key].segments.push({
        id: entry.id,
        startTime: entry.start,
        endTime: entry.end,
        durationTime,
      });

      return tasks;
    }, {}),
  );

const taskService = {
  create: async ({title, projectId, estimatedMinutes = null}) => {
    if (!title || title.trim().length === 0)
      throw new Error('Task title cannot be empty');
    if (title.length > 100)
      throw new Error('Task title cannot exceed 100 characters');

    const project = await projectModel.selectProject(projectId);
    if (!project) throw new Error('Project does not exist');

    const existingTask = await taskModel.findByTitleAndProject(
      title,
      projectId,
    );
    if (existingTask)
      throw new Error(`Task "${title}" already exists in this project`);

    const [id] = await taskModel.create({title, projectId, estimatedMinutes});
    return id;
  },

  toggleTask: async ({title, projectId, start = getLocalNow()}) => {
    if (!title || title.trim().length === 0)
      throw new Error('Task title cannot be empty');
    if (title.length > 100)
      throw new Error('Task title cannot exceed 100 characters');

    const project = await projectModel.selectProject(projectId);
    if (!project) throw new Error('Project does not exist');

    // Get or create the task definition
    const task = await taskModel.getOrCreate({title, projectId});

    const activeEntry = await timeEntryModel.selectActiveEntry();

    if (!activeEntry) {
      // No active entry, start new one
      const [id] = await timeEntryModel.create({taskId: task.id, start});
      return {action: 'started', entryId: id, taskId: task.id};
    }

    // Check if active entry is for the same task
    if (activeEntry.task_id === task.id) {
      // Same task, stop it
      await timeEntryModel.update({id: activeEntry.id, end: getLocalNow()});
      return {action: 'stopped', entryId: activeEntry.id, taskId: task.id};
    } else {
      // Different task, switch
      await timeEntryModel.update({id: activeEntry.id, end: getLocalNow()});
      const [id] = await timeEntryModel.create({taskId: task.id, start});
      return {
        action: 'switched',
        stoppedEntryId: activeEntry.id,
        startedEntryId: id,
        taskId: task.id,
      };
    }
  },

  toggleTaskById: async ({taskId, start = getLocalNow()}) => {
    const task = await taskModel.selectById(taskId);
    if (!task) throw new Error('Task does not exist');

    const activeEntry = await timeEntryModel.selectActiveEntry();

    if (!activeEntry) {
      const [id] = await timeEntryModel.create({taskId, start});
      return {action: 'started', entryId: id, taskId};
    }

    if (activeEntry.task_id === taskId) {
      await timeEntryModel.update({id: activeEntry.id, end: getLocalNow()});
      return {action: 'stopped', entryId: activeEntry.id, taskId};
    } else {
      await timeEntryModel.update({id: activeEntry.id, end: getLocalNow()});
      const [id] = await timeEntryModel.create({taskId, start});
      return {
        action: 'switched',
        stoppedEntryId: activeEntry.id,
        startedEntryId: id,
        taskId,
      };
    }
  },

  selectActiveTask: async () => {
    const activeEntry = await timeEntryModel.selectActiveEntry();
    if (!activeEntry) return null;

    const task = await taskModel.selectById(activeEntry.task_id);
    return {
      ...task,
      activeEntry,
      start: activeEntry.start,
      end: activeEntry.end,
    };
  },

  getActiveTask: async () => taskService.selectActiveTask(),

  endTask: async ({id, end = getLocalNow()}) => {
    const activeEntry = await timeEntryModel.selectActiveEntry();
    if (!activeEntry) throw new Error('No active task found');

    if (activeEntry.id !== id)
      throw new Error('Provided entry ID does not match the active entry');

    return timeEntryModel.update({id, end});
  },

  addManualTimeEntry: async ({
    taskId,
    input,
    selectedDate = retriveYYYYMMDD(),
  }) => {
    const task = await taskModel.selectById(taskId);
    if (!task) throw new Error('Task does not exist');

    const parsed = await prepareManualTimeEntry({input, selectedDate});
    return saveManualTimeEntry(taskId, parsed);
  },

  addManualTimeEntryByTitle: async ({
    title,
    projectId,
    input,
    selectedDate = retriveYYYYMMDD(),
  }) => {
    const cleanedTitle = title?.trim();
    if (!cleanedTitle) throw new Error('Task title cannot be empty');
    if (cleanedTitle.length > 100)
      throw new Error('Task title cannot exceed 100 characters');

    const project = await projectModel.selectProject(projectId);
    if (!project) throw new Error('Project does not exist');

    const parsed = await prepareManualTimeEntry({input, selectedDate});
    const task = await taskModel.getOrCreate({
      title: cleanedTitle,
      projectId,
    });

    return saveManualTimeEntry(task.id, parsed);
  },

  selectAll: () => taskModel.listAll(),

  selectById: id => taskModel.selectById(id),

  selectByProjectId: projectId => taskModel.selectByProjectId(projectId),

  selectProjectTaskList: async projectId => {
    const tasks = await taskModel.selectByProjectIdWithActivity(projectId);

    return tasks
      .map(task => ({
        id: task.id,
        title: task.title,
        projectId: task.project_id,
        estimatedMinutes: task.estimated_minutes,
        epic: task.epic,
        category: task.category,
        isExploration: Boolean(task.is_exploration),
        scope: task.scope,
        latestActivity: task.latest_activity || null,
        isActive: Number(task.is_active) === 1,
      }))
      .sort((left, right) => {
        if (left.isActive !== right.isActive) return left.isActive ? -1 : 1;

        const leftActivity = left.latestActivity
          ? new Date(left.latestActivity).getTime()
          : 0;
        const rightActivity = right.latestActivity
          ? new Date(right.latestActivity).getTime()
          : 0;
        if (leftActivity !== rightActivity) return rightActivity - leftActivity;

        return left.title.localeCompare(right.title);
      });
  },

  getTaskSuggestions: async projectId => {
    const tasks = await taskModel.getDistinctTaskNamesByProject(projectId);
    return tasks.map(task => task.title);
  },

  update: async (taskId, title, projectId) => {
    if (!title || title.trim().length === 0)
      throw new Error('Task title cannot be empty');
    if (title.length > 100)
      throw new Error('Task title cannot exceed 100 characters');

    const task = await taskModel.selectById(taskId);
    if (!task) throw new Error('Task not found');

    const existing = await taskModel.findByTitleAndProject(title, projectId);
    if (existing && existing.id !== taskId)
      throw new Error(`Task "${title}" already exists in this project`);

    return taskModel.update({id: taskId, title});
  },

  updateEstimation: async (taskId, estimatedMinutes) => {
    const task = await taskModel.selectById(taskId);
    if (!task) throw new Error('Task not found');

    return taskModel.update({id: taskId, estimatedMinutes});
  },

  updateMetadata: async (taskId, {epic, category, isExploration, scope}) => {
    const task = await taskModel.selectById(taskId);
    if (!task) throw new Error('Task not found');

    validateMetadata({epic, category, scope});

    return taskModel.updateMetadata({
      id: taskId,
      epic,
      category,
      isExploration,
      scope,
    });
  },

  toggleExploration: async taskId => {
    const task = await taskModel.selectById(taskId);
    if (!task) throw new Error('Task not found');

    const newValue = !task.is_exploration;
    await taskModel.updateMetadata({id: taskId, isExploration: newValue});
    return newValue;
  },

  delete: id => taskModel.delete(id),

  deleteByTitleAndDate: async (title, projectId, date) => {
    // Find task by title and project
    const task = await taskModel.findByTitleAndProject(title, projectId);
    if (!task)
      throw new Error(`No task found with title "${title}" in this project`);

    // Delete time entries for this task on the given date
    const entries = await timeEntryModel.selectByDate(date);
    const taskEntries = entries.filter(e => e.task_id === task.id);

    for (const entry of taskEntries) {
      await timeEntryModel.delete(entry.id);
    }

    return taskEntries.length;
  },

  getTodayHours: async (projectId = null) => {
    const today = retriveYYYYMMDD();
    const entries = await timeEntryModel.getTodayEntriesByProject(
      today,
      projectId,
    );
    return taskService.calculateTimeSpend(entries);
  },

  getTasksByProjectAndDate: async (projectId, date = null) => {
    const targetDate =
      typeof date === 'string' ? date : retriveYYYYMMDD(date || new Date());
    const entries = await timeEntryModel.selectByDateWithTask(targetDate);
    return entries.filter(entry => entry.project_id === projectId);
  },

  calculateTimeSpend: (entries, isT1 = false) => {
    let totalSeconds = sumEntryDurations(entries);
    let hours = Math.floor(totalSeconds / 3600);

    if (isT1) {
      try {
        const {t1} = require('../utils/t1.js');
        hours = t1(hours, isT1);
        totalSeconds = hours * 3600 + (totalSeconds % 3600);
      } catch (e) {}
    }

    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return {hours, minutes, totalSeconds};
  },

  getTasksByDateRange: async (startDate, endDate) => {
    const entries = await timeEntryModel.selectByDateRangeWithTask({
      startDate,
      endDate,
    });
    return groupTaskEntries(entries);
  },

  getAllTasksFromToday: async (date = new Date(), pId = null) => {
    const dateStr = typeof date === 'string' ? date : retriveYYYYMMDD(date);
    const entries = await timeEntryModel.selectByDateWithTask(dateStr);

    // Filter by project if specified
    const filteredEntries = pId
      ? entries.filter(e => e.project_id === pId)
      : entries;

    // Add active entry if exists
    const activeEntry = await timeEntryModel.selectActiveEntry();
    if (activeEntry) {
      const activeTask = await taskModel.selectById(activeEntry.task_id);
      if (activeTask && (!pId || activeTask.project_id === pId)) {
        filteredEntries.push({
          ...activeEntry,
          title: activeTask.title,
          project_id: activeTask.project_id,
          estimated_minutes: activeTask.estimated_minutes,
          epic: activeTask.epic,
          category: activeTask.category,
          is_exploration: activeTask.is_exploration,
          scope: activeTask.scope,
        });
      }
    }

    return groupTaskEntries(filteredEntries);
  },
};

export default taskService;
