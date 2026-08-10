const TASK_PANEL_CHROME_HEIGHT = 5;
const TASK_ITEM_HEIGHT = 2;

export const getVisibleTaskCount = panelHeight =>
  Math.max(
    1,
    Math.floor(
      (Math.max(0, Math.floor(panelHeight)) - TASK_PANEL_CHROME_HEIGHT) /
        TASK_ITEM_HEIGHT,
    ),
  );
