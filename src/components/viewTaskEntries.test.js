import {beforeEach, describe, expect, it, vi} from 'vitest';

const harness = vi.hoisted(() => ({
  getProjectById: vi.fn(),
  selectClientEntries: vi.fn(),
  selectTaskEntries: vi.fn(),
}));

vi.mock('../services/projectService.js', () => ({
  default: {getProjectById: harness.getProjectById},
}));

vi.mock('../models/timeEntry.js', () => ({
  default: {
    selectByDateRangeWithTask: harness.selectClientEntries,
    selectByTaskIdWithDateRange: harness.selectTaskEntries,
  },
}));

import {loadTaskViewEntries} from './viewTaskEntries.js';

const task = {id: 3, project_id: 2, title: 'Selected task'};
const range = {startDate: '2026-08-18', endDate: '2026-08-18'};

describe('loadTaskViewEntries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    harness.selectClientEntries.mockResolvedValue([{id: 10, task_id: 3}]);
    harness.selectTaskEntries.mockResolvedValue([{id: 10, task_id: 3}]);
  });

  it('resolves missing project metadata before loading client overlap entries', async () => {
    harness.getProjectById.mockResolvedValue({id: 2, clientId: 1});

    const entries = await loadTaskViewEntries({
      task,
      projects: [],
      ...range,
    });

    expect(harness.getProjectById).toHaveBeenCalledWith(2);
    expect(harness.selectClientEntries).toHaveBeenCalledWith({
      ...range,
      clientId: 1,
    });
    expect(harness.selectTaskEntries).not.toHaveBeenCalled();
    expect(entries).toEqual([{id: 10, task_id: 3}]);
  });

  it('falls back to selected-task entries instead of loading every client', async () => {
    harness.getProjectById.mockResolvedValue(null);

    const entries = await loadTaskViewEntries({
      task,
      projects: [],
      ...range,
    });

    expect(harness.selectClientEntries).not.toHaveBeenCalled();
    expect(harness.selectTaskEntries).toHaveBeenCalledWith(
      3,
      range.startDate,
      range.endDate,
    );
    expect(entries).toEqual([
      expect.objectContaining({
        id: 10,
        task_id: 3,
        title: 'Selected task',
        project_id: 2,
      }),
    ]);
  });
});
