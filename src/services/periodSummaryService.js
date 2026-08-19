import clientModel from '../models/client.js';
import projectModel from '../models/project.js';
import pricingService, {computeLiveClientMetrics} from './pricingService.js';
import taskService from './taskService.js';
import {calculateDuration, retriveYYYYMMDD} from '../utils.js';

const sumEstimatedSeconds = tasks =>
  tasks.reduce((total, task) => total + (task.estimatedMinutes || 0) * 60, 0);

const addMoney = (totals, clientSummary) => {
  if (clientSummary.earned === null) return;

  const current = totals.get(clientSummary.currency) || {
    currency: clientSummary.currency,
    earned: 0,
    shouldEarn: 0,
  };
  current.earned += clientSummary.earned;
  current.shouldEarn += clientSummary.shouldEarn || 0;
  totals.set(clientSummary.currency, current);
};

export const computePeriodSummary = (snapshot, now = new Date()) => {
  const scopedClients = snapshot.clientId
    ? snapshot.clients.filter(client => client.id === snapshot.clientId)
    : snapshot.clients;
  const scopedProjectIds = new Set(
    snapshot.projects
      .filter(
        project =>
          !snapshot.clientId || project.client_id === snapshot.clientId,
      )
      .map(project => project.id),
  );
  const scopedTasks = snapshot.clientId
    ? snapshot.tasks.filter(task => scopedProjectIds.has(task.projectId))
    : snapshot.tasks;
  const periodSegments = scopedTasks.flatMap(task => task.segments || []);
  const projectCount = new Set(
    scopedTasks.map(task => task.projectId).filter(Boolean),
  ).size;
  const activeDayCount = new Set(
    periodSegments
      .filter(segment => segment.startTime)
      .map(segment => retriveYYYYMMDD(new Date(segment.startTime))),
  ).size;
  const projectsById = new Map(
    snapshot.projects.map(project => [project.id, project]),
  );
  const metricsByClientId = new Map(
    snapshot.metricSnapshots.map(metric => [
      metric.clientId,
      computeLiveClientMetrics(metric, now),
    ]),
  );

  const clientSummaries = scopedClients
    .map(client => {
      const metrics = metricsByClientId.get(client.id);
      const tasks = scopedTasks.filter(task => {
        const project = projectsById.get(task.projectId);
        return project?.client_id === client.id;
      });
      const estimatedSeconds = sumEstimatedSeconds(tasks);
      const workedSeconds = metrics?.totalSeconds || 0;
      const targetSeconds = (metrics?.target || 0) * 3600;
      const hourlyRate = metrics?.hourlyRate ?? null;

      return {
        clientId: client.id,
        name: client.name,
        workedSeconds,
        targetSeconds,
        remainingTargetSeconds: Math.max(0, targetSeconds - workedSeconds),
        estimatedSeconds,
        remainingEstimatedSeconds: Math.max(
          0,
          estimatedSeconds - workedSeconds,
        ),
        earned: metrics?.earnings ?? null,
        shouldEarn: metrics?.expectedEarnings ?? null,
        hourlyRate,
        currency: metrics?.currency || client.currency || 'PLN',
        taskCount: tasks.length,
        activeTaskCount: tasks.filter(task => task.isActive).length,
      };
    })
    .filter(client => snapshot.clientId || client.taskCount > 0);

  const moneyTotals = new Map();
  clientSummaries.forEach(client => addMoney(moneyTotals, client));

  const selectedTask = scopedTasks.find(task => task.id === snapshot.taskId);
  const taskWorkedSeconds = snapshot.taskId
    ? (selectedTask?.segments || []).reduce(
        (total, segment) =>
          total + calculateDuration(segment.startTime, segment.endTime || now),
        0,
      )
    : null;
  const taskEstimatedMinutes =
    selectedTask?.estimatedMinutes ?? snapshot.taskEstimatedMinutes;
  const taskEstimateSeconds =
    taskEstimatedMinutes !== null && taskEstimatedMinutes !== undefined
      ? taskEstimatedMinutes * 60
      : null;

  return {
    workedSeconds: clientSummaries.reduce(
      (total, client) => total + client.workedSeconds,
      0,
    ),
    targetSeconds: clientSummaries.reduce(
      (total, client) => total + client.targetSeconds,
      0,
    ),
    remainingTargetSeconds: clientSummaries.reduce(
      (total, client) => total + client.remainingTargetSeconds,
      0,
    ),
    estimatedSeconds: clientSummaries.reduce(
      (total, client) => total + client.estimatedSeconds,
      0,
    ),
    remainingEstimatedSeconds: clientSummaries.reduce(
      (total, client) => total + client.remainingEstimatedSeconds,
      0,
    ),
    taskCount: scopedTasks.length,
    projectCount,
    sessionCount: periodSegments.length,
    activeDayCount,
    activeTaskCount: scopedTasks.filter(task => task.isActive).length,
    activeTaskTitle: scopedTasks.find(task => task.isActive)?.title || null,
    taskWorkedSeconds,
    taskEstimateSeconds,
    taskRemainingSeconds:
      taskEstimateSeconds === null
        ? null
        : Math.max(0, taskEstimateSeconds - taskWorkedSeconds),
    hasUnpricedClients: clientSummaries.some(
      client => client.taskCount > 0 && client.hourlyRate === null,
    ),
    moneyTotals: [...moneyTotals.values()],
    clients: clientSummaries,
  };
};

const getPeriodSummarySnapshot = async (
  rangeType,
  startDate,
  endDate,
  clientId = null,
  taskId = null,
  taskEstimatedMinutes = null,
) => {
  const [allClients, allProjects, allTasks] = await Promise.all([
    clientModel.listAll(),
    projectModel.listAll(),
    taskService.getTasksByDateRange(startDate, endDate),
  ]);
  const clients = clientId
    ? allClients.filter(client => client.id === clientId)
    : allClients;
  const projects = clientId
    ? allProjects.filter(project => project.client_id === clientId)
    : allProjects;
  const projectIds = new Set(projects.map(project => project.id));
  const tasks = clientId
    ? allTasks.filter(task => projectIds.has(task.projectId))
    : allTasks;
  const metricSnapshots = await Promise.all(
    clients.map(client =>
      pricingService.getClientMetricSnapshot(
        client.id,
        rangeType,
        startDate,
        endDate,
      ),
    ),
  );

  return {
    rangeType,
    startDate,
    endDate,
    clientId,
    taskId,
    taskEstimatedMinutes,
    clients,
    projects,
    tasks,
    metricSnapshots,
    fetchedAt: new Date(),
  };
};

export default {getPeriodSummarySnapshot};
