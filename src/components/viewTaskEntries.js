import timeEntryModel from '../models/timeEntry.js';
import projectService from '../services/projectService.js';

export const loadTaskViewEntries = async ({
  task,
  projects,
  startDate,
  endDate,
}) => {
  const cachedProject = projects.find(
    project => project.id === task.project_id,
  );
  const project =
    cachedProject || (await projectService.getProjectById(task.project_id));
  const clientId = project?.client_id ?? project?.clientId;

  if (clientId !== null && clientId !== undefined) {
    return timeEntryModel.selectByDateRangeWithTask({
      startDate,
      endDate,
      clientId,
    });
  }

  const taskEntries = await timeEntryModel.selectByTaskIdWithDateRange(
    task.id,
    startDate,
    endDate,
  );
  return taskEntries.map(entry => ({
    ...entry,
    title: entry.title || task.title,
    project_id: entry.project_id ?? task.project_id,
  }));
};
