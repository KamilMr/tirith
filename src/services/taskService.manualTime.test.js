import {beforeEach, describe, expect, it, vi} from 'vitest';

const models = vi.hoisted(() => ({
  task: {
    getOrCreate: vi.fn(),
  },
  timeEntry: {
    selectActiveEntry: vi.fn(),
    selectByDate: vi.fn(),
    create: vi.fn(),
  },
  project: {
    selectProject: vi.fn(),
  },
}));

vi.mock('../models/task.js', () => ({default: models.task}));
vi.mock('../models/timeEntry.js', () => ({default: models.timeEntry}));
vi.mock('../models/project.js', () => ({default: models.project}));

import taskService from './taskService.js';

describe('taskService.addManualTimeEntryByTitle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    models.project.selectProject.mockResolvedValue({id: 7});
    models.task.getOrCreate.mockResolvedValue({id: 42});
    models.timeEntry.selectActiveEntry.mockResolvedValue(null);
    models.timeEntry.selectByDate.mockResolvedValue([]);
    models.timeEntry.create.mockResolvedValue([99]);
  });

  it('gets or creates the named task and adds the parsed minutes to it', async () => {
    const result = await taskService.addManualTimeEntryByTitle({
      title: '  Replacement task  ',
      projectId: 7,
      input: '09:00 20m',
      selectedDate: '2026-08-06',
    });

    expect(models.task.getOrCreate).toHaveBeenCalledWith({
      title: 'Replacement task',
      projectId: 7,
    });
    expect(models.timeEntry.create).toHaveBeenCalledWith({
      taskId: 42,
      start: expect.any(Date),
      end: expect.any(Date),
    });
    expect(result).toMatchObject({
      entryId: 99,
      taskId: 42,
      durationMinutes: 20,
    });
  });
});
