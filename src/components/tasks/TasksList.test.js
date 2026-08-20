import React from 'react';
import {renderToString} from 'ink';
import {describe, expect, it} from 'vitest';
import TasksList from './TasksList.js';
import {getVisibleTaskCount} from './taskListLayout.js';

describe('TasksList', () => {
  it('keeps every visible task on one terminal row', () => {
    const projectTasks = Array.from({length: 10}, (_, index) => ({
      id: index + 1,
      title: `Task ${index + 1} with a title that exceeds the panel width`,
      estimatedMinutes: 960,
      category: 'feature',
      scope: 'large',
      isExploration: true,
      epic: 'Infrastructure',
    }));

    const output = renderToString(
      <TasksList
        panelHeight={11}
        projectTasks={projectTasks}
        selectedTaskId={1}
      />,
      {columns: 30},
    );

    expect(output.split('\n')).toHaveLength(6);
    expect(output).toContain('Task 1');
    expect(output).toContain('Task 6');
    expect(output).not.toContain('Task 7');
  });
});

describe('getVisibleTaskCount', () => {
  it('shows one task in a compact panel', () => {
    expect(getVisibleTaskCount(6)).toBe(1);
  });

  it('uses each available content row for a one-line task item', () => {
    expect(getVisibleTaskCount(11)).toBe(6);
    expect(getVisibleTaskCount(23)).toBe(18);
  });

  it.each([0, 1, 5])(
    'keeps at least the selected task visible at panel height %i',
    panelHeight => {
      expect(getVisibleTaskCount(panelHeight)).toBe(1);
    },
  );
});
