import taskService from '../services/taskService.js';
import taskModel from '../models/task.js';
import projectModel from '../models/project.js';
import timeEntryModel from '../models/timeEntry.js';
import {getLocalNow, retriveYYYYMMDD} from '../utils.js';

const json = data => console.log(JSON.stringify(data));

export const create = async (title, {project: projectId}) => {
  const id = await taskService.create({title, projectId: Number(projectId)});
  const task = await taskModel.selectById(id);
  const project = await projectModel.selectById(task.project_id);

  json({
    taskId: id,
    title: task.title,
    project: project?.name ?? null,
    projectId: task.project_id,
  });
};

export const toggle = async taskId => {
  const id = Number(taskId);
  const result = await taskService.toggleTaskById({taskId: id});
  const task = await taskModel.selectById(id);
  const project = await projectModel.selectById(task.project_id);

  json({
    action: result.action,
    taskId: id,
    title: task.title,
    project: project?.name ?? null,
    projectId: task.project_id,
  });
};

export const active = async () => {
  const result = await taskService.getActiveTask();
  if (!result) {
    json({active: false});
    return;
  }

  const project = await projectModel.selectById(result.project_id);
  json({
    active: true,
    taskId: result.id,
    title: result.title,
    project: project?.name ?? null,
    projectId: result.project_id,
    startedAt: result.start,
  });
};

export const list = async ({project: projectId, date} = {}) => {
  const targetDate = date || retriveYYYYMMDD();
  const pId = projectId ? Number(projectId) : null;
  const tasks = await taskService.getAllTasksFromToday(targetDate, pId);

  const projects = await projectModel.listAll();
  const projectMap = Object.fromEntries(projects.map(p => [p.id, p.name]));

  const result = tasks.map(t => ({
    taskId: t.id,
    title: t.title,
    project: projectMap[t.projectId] ?? null,
    projectId: t.projectId,
    totalSeconds: t.totalSec,
    isActive: t.isActive || false,
  }));

  json(result);
};

export const toggleName = async (title, {project: projectId}) => {
  const result = await taskService.toggleTask({
    title,
    projectId: Number(projectId),
  });
  const task = await taskModel.selectById(result.taskId);
  const project = await projectModel.selectById(task.project_id);

  json({
    action: result.action,
    taskId: result.taskId,
    title: task.title,
    project: project?.name ?? null,
    projectId: task.project_id,
  });
};

export const stop = async () => {
  const activeEntry = await timeEntryModel.selectActiveEntry();
  if (!activeEntry) {
    json({active: false});
    return;
  }

  await timeEntryModel.update({id: activeEntry.id, end: getLocalNow()});
  const task = await taskModel.selectById(activeEntry.task_id);
  const project = await projectModel.selectById(task.project_id);

  json({
    action: 'stopped',
    taskId: task.id,
    title: task.title,
    project: project?.name ?? null,
    projectId: task.project_id,
  });
};
