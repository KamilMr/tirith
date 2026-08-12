import clientModel from '../models/client.js';
import projectModel from '../models/project.js';
import pricingService, {
  calculateEstimatedPrice,
  computeLiveClientMetrics,
} from './pricingService.js';
import taskService from './taskService.js';

const sumEstimatedSeconds = tasks =>
  tasks.reduce((total, task) => total + (task.estimatedMinutes || 0) * 60, 0);

const addMoney = (totals, clientSummary) => {
  if (clientSummary.earned === null) return;

  const current = totals.get(clientSummary.currency) || {
    currency: clientSummary.currency,
    earned: 0,
    estimatedPrice: 0,
    atTarget: 0,
  };
  current.earned += clientSummary.earned;
  current.estimatedPrice += clientSummary.estimatedPrice || 0;
  current.atTarget += clientSummary.atTarget || 0;
  totals.set(clientSummary.currency, current);
};

export const computePeriodSummary = (snapshot, now = new Date()) => {
  const projectsById = new Map(
    snapshot.projects.map(project => [project.id, project]),
  );
  const metricsByClientId = new Map(
    snapshot.metricSnapshots.map(metric => [
      metric.clientId,
      computeLiveClientMetrics(metric, now),
    ]),
  );

  const clientSummaries = snapshot.clients.map(client => {
    const metrics = metricsByClientId.get(client.id);
    const tasks = snapshot.tasks.filter(task => {
      const project = projectsById.get(task.projectId);
      return project?.client_id === client.id;
    });
    const estimatedSeconds = sumEstimatedSeconds(tasks);
    const workedSeconds = metrics?.totalSeconds || 0;
    const hourlyRate = metrics?.hourlyRate ?? null;

    return {
      clientId: client.id,
      name: client.name,
      workedSeconds,
      targetSeconds: (metrics?.target || 0) * 3600,
      estimatedSeconds,
      remainingEstimatedSeconds: Math.max(0, estimatedSeconds - workedSeconds),
      earned: metrics?.earnings ?? null,
      estimatedPrice: calculateEstimatedPrice(
        estimatedSeconds / 60,
        hourlyRate,
      ),
      atTarget: metrics?.expectedEarnings ?? null,
      hourlyRate,
      currency: metrics?.currency || client.currency || 'PLN',
      taskCount: tasks.length,
      activeTaskCount: tasks.filter(task => task.isActive).length,
    };
  });

  const moneyTotals = new Map();
  clientSummaries.forEach(client => addMoney(moneyTotals, client));

  return {
    workedSeconds: clientSummaries.reduce(
      (total, client) => total + client.workedSeconds,
      0,
    ),
    targetSeconds: clientSummaries.reduce(
      (total, client) => total + client.targetSeconds,
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
    taskCount: snapshot.tasks.length,
    activeTaskCount: snapshot.tasks.filter(task => task.isActive).length,
    activeTaskTitle: snapshot.tasks.find(task => task.isActive)?.title || null,
    hasUnpricedClients: clientSummaries.some(
      client => client.taskCount > 0 && client.hourlyRate === null,
    ),
    moneyTotals: [...moneyTotals.values()],
    clients: clientSummaries.filter(client => client.taskCount > 0),
  };
};

const getPeriodSummarySnapshot = async (rangeType, startDate, endDate) => {
  const [clients, projects, tasks] = await Promise.all([
    clientModel.listAll(),
    projectModel.listAll(),
    taskService.getTasksByDateRange(startDate, endDate),
  ]);
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
    clients,
    projects,
    tasks,
    metricSnapshots,
    fetchedAt: new Date(),
  };
};

export default {getPeriodSummarySnapshot};
