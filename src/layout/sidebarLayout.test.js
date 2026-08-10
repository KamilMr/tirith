import {describe, expect, it} from 'vitest';
import {CLIENT, PROJECTS, TASKS, VIEW} from '../consts.js';
import {getSidebarHeights} from './sidebarLayout.js';

const heightFor = (heights, section) =>
  ({
    [CLIENT]: heights.clientHeight,
    [PROJECTS]: heights.projectHeight,
    [TASKS]: heights.taskHeight,
  })[section];

describe('getSidebarHeights', () => {
  it.each([CLIENT, PROJECTS, TASKS])(
    'expands %s and keeps the other panels compact',
    focusedSection => {
      const heights = getSidebarHeights({
        mainHeight: 23,
        focusedSection,
        activeSidebarSection: CLIENT,
      });

      expect(heightFor(heights, focusedSection)).toBe(11);
      expect(
        [CLIENT, PROJECTS, TASKS]
          .filter(section => section !== focusedSection)
          .map(section => heightFor(heights, section)),
      ).toEqual([6, 6]);
    },
  );

  it.each([CLIENT, PROJECTS, TASKS])(
    'preserves the %s layout while View is focused',
    activeSidebarSection => {
      const heights = getSidebarHeights({
        mainHeight: 23,
        focusedSection: VIEW,
        activeSidebarSection,
      });

      expect(heightFor(heights, activeSidebarSection)).toBe(11);
    },
  );

  it.each([23, 39, 80])(
    'uses exactly the available main height at terminal height %i',
    mainHeight => {
      const heights = getSidebarHeights({
        mainHeight,
        focusedSection: TASKS,
        activeSidebarSection: TASKS,
      });

      expect(Object.values(heights).reduce((sum, height) => sum + height, 0)).toBe(
        mainHeight,
      );
      expect(Object.values(heights).every(height => height >= 0)).toBe(true);
    },
  );

  it.each([0, 1, 2, 5, 17])(
    'keeps heights non-negative and contained when only %i rows are available',
    mainHeight => {
      const heights = getSidebarHeights({
        mainHeight,
        focusedSection: PROJECTS,
        activeSidebarSection: PROJECTS,
      });

      expect(Object.values(heights).reduce((sum, height) => sum + height, 0)).toBe(
        mainHeight,
      );
      expect(Object.values(heights).every(height => height >= 0)).toBe(true);
    },
  );
});
