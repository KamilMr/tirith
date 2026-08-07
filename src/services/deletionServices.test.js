import {beforeEach, describe, expect, it, vi} from 'vitest';

const modelDeletes = vi.hoisted(() => ({
  client: vi.fn(),
  project: vi.fn(),
  task: vi.fn(),
}));

vi.mock('../models/client.js', () => ({
  default: {delete: modelDeletes.client},
}));

vi.mock('../models/project.js', () => ({
  default: {delete: modelDeletes.project},
}));

vi.mock('../models/task.js', () => ({
  default: {delete: modelDeletes.task},
}));

import clientService from './clientService.js';
import projectService from './projectService.js';
import taskService from './taskService.js';

describe('deletion services', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes only the client root and relies on database cascades', () => {
    const result = Symbol('client deletion');
    modelDeletes.client.mockReturnValue(result);

    expect(clientService.delete({id: 11})).toBe(result);
    expect(modelDeletes.client).toHaveBeenCalledWith(11);
    expect(modelDeletes.project).not.toHaveBeenCalled();
    expect(modelDeletes.task).not.toHaveBeenCalled();
  });

  it('deletes only the project root and relies on database cascades', () => {
    const result = Symbol('project deletion');
    modelDeletes.project.mockReturnValue(result);

    expect(projectService.delete({id: 22})).toBe(result);
    expect(modelDeletes.project).toHaveBeenCalledWith(22);
    expect(modelDeletes.task).not.toHaveBeenCalled();
  });

  it('deletes only the task root and relies on database cascades', () => {
    const result = Symbol('task deletion');
    modelDeletes.task.mockReturnValue(result);

    expect(taskService.delete(33)).toBe(result);
    expect(modelDeletes.task).toHaveBeenCalledWith(33);
  });

  it('does not expose the obsolete project-wide task deletion helper', () => {
    expect(taskService.deleteByProject).toBeUndefined();
  });
});
