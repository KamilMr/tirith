import {CLIENT, PROJECTS, TASKS} from '../consts.js';

const COMPACT_PANEL_HEIGHT = 6;
const SIDEBAR_SECTIONS = [CLIENT, PROJECTS, TASKS];

export const getSidebarHeights = ({
  mainHeight,
  focusedSection,
  activeSidebarSection,
}) => {
  const availableHeight = Math.max(0, Math.floor(mainHeight));
  const expandedSection = SIDEBAR_SECTIONS.includes(focusedSection)
    ? focusedSection
    : SIDEBAR_SECTIONS.includes(activeSidebarSection)
      ? activeSidebarSection
      : CLIENT;
  const compactHeight = Math.min(
    COMPACT_PANEL_HEIGHT,
    Math.floor(availableHeight / SIDEBAR_SECTIONS.length),
  );
  const expandedHeight = availableHeight - compactHeight * 2;

  return {
    clientHeight:
      expandedSection === CLIENT ? expandedHeight : compactHeight,
    projectHeight:
      expandedSection === PROJECTS ? expandedHeight : compactHeight,
    taskHeight: expandedSection === TASKS ? expandedHeight : compactHeight,
  };
};
