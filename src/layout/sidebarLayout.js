import {CLIENT, PROJECTS, TASKS} from '../consts.js';

const COMPACT_PANEL_HEIGHT = 6;
const SIDEBAR_SECTIONS = [CLIENT, PROJECTS, TASKS];

export const getAppHeights = rows => {
  const terminalHeight = Math.max(0, Math.floor(rows || 0));
  // Ink clears the terminal when rendered output occupies every row.
  const renderHeight = Math.max(0, terminalHeight - 1);
  const mainHeight = Math.max(0, renderHeight - 1);

  return {renderHeight, mainHeight};
};

const getExpandedSection = (focusedSection, activeSidebarSection) => {
  if (SIDEBAR_SECTIONS.includes(focusedSection)) return focusedSection;
  if (SIDEBAR_SECTIONS.includes(activeSidebarSection))
    return activeSidebarSection;
  return CLIENT;
};

export const getSidebarHeights = ({
  mainHeight,
  focusedSection,
  activeSidebarSection,
}) => {
  const availableHeight = Math.max(0, Math.floor(mainHeight));
  const expandedSection = getExpandedSection(
    focusedSection,
    activeSidebarSection,
  );
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
