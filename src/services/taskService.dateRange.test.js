import {describe, expect, it, vi} from 'vitest';

const models = vi.hoisted(() => ({
  task: {},
  timeEntry: {
    selectByDateRangeWithTask: vi.fn(),
  },
  project: {},
}));

vi.mock('../models/task.js', () => ({default: models.task}));
vi.mock('../models/timeEntry.js', () => ({default: models.timeEntry}));
vi.mock('../models/project.js', () => ({default: models.project}));

import taskService from './taskService.js';

describe('taskService.getTasksByDateRange', () => {
  it('groups task entries across the selected calendar period', async () => {
    models.timeEntry.selectByDateRangeWithTask.mockResolvedValue([
      {
        id: 10,
        task_id: 1,
        title: 'Feature',
        project_id: 7,
        start: new Date('2026-08-10T09:00:00Z'),
        end: new Date('2026-08-10T10:00:00Z'),
      },
      {
        id: 11,
        task_id: 1,
        title: 'Feature',
        project_id: 7,
        start: new Date('2026-08-11T09:00:00Z'),
        end: new Date('2026-08-11T09:30:00Z'),
      },
    ]);

    const tasks = await taskService.getTasksByDateRange(
      '2026-08-10',
      '2026-08-16',
    );

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      id: 1,
      title: 'Feature',
      projectId: 7,
      totalSec: 5400,
    });
    expect(tasks[0].segments).toHaveLength(2);
    expect(models.timeEntry.selectByDateRangeWithTask).toHaveBeenCalledWith({
      startDate: '2026-08-10',
      endDate: '2026-08-16',
    });
  });
});
