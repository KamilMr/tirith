import {beforeEach, describe, expect, it, vi} from 'vitest';

const models = vi.hoisted(() => ({
  task: {
    selectByProjectIdWithActivity: vi.fn(),
  },
  timeEntry: {},
  project: {},
}));

vi.mock('../models/task.js', () => ({default: models.task}));
vi.mock('../models/timeEntry.js', () => ({default: models.timeEntry}));
vi.mock('../models/project.js', () => ({default: models.project}));

import taskService from './taskService.js';

describe('taskService.selectProjectTaskList', () => {
  beforeEach(() => vi.clearAllMocks());

  it('puts the running task first and sorts the rest by latest activity', async () => {
    models.task.selectByProjectIdWithActivity.mockResolvedValue([
      {
        id: 1,
        title: 'Never used',
        project_id: 7,
        latest_activity: null,
        is_active: 0,
      },
      {
        id: 2,
        title: 'Recently stopped',
        project_id: 7,
        latest_activity: new Date('2026-08-10T12:00:00Z'),
        is_active: 0,
      },
      {
        id: 3,
        title: 'Running',
        project_id: 7,
        latest_activity: new Date('2026-08-09T12:00:00Z'),
        is_active: 1,
      },
      {
        id: 4,
        title: 'Older',
        project_id: 7,
        latest_activity: new Date('2026-08-08T12:00:00Z'),
        is_active: 0,
      },
    ]);

    const tasks = await taskService.selectProjectTaskList(7);

    expect(tasks.map(task => task.title)).toEqual([
      'Running',
      'Recently stopped',
      'Older',
      'Never used',
    ]);
    expect(tasks[0]).toMatchObject({
      projectId: 7,
      isActive: true,
      latestActivity: new Date('2026-08-09T12:00:00Z'),
    });
    expect(models.task.selectByProjectIdWithActivity).toHaveBeenCalledWith(7);
  });

  it('sorts never-used tasks alphabetically', async () => {
    models.task.selectByProjectIdWithActivity.mockResolvedValue([
      {id: 1, title: 'Zulu', project_id: 7, is_active: 0},
      {id: 2, title: 'Alpha', project_id: 7, is_active: 0},
    ]);

    const tasks = await taskService.selectProjectTaskList(7);

    expect(tasks.map(task => task.title)).toEqual(['Alpha', 'Zulu']);
  });
});
