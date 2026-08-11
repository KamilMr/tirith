export const BAR_WIDTH = 20;

const EMPTY_BACKGROUND_COLOR = 'gray';

const getContrastColor = backgroundColor =>
  backgroundColor === 'red' || backgroundColor === EMPTY_BACKGROUND_COLOR
    ? 'white'
    : 'black';

export const formatProgressBarText = (workedHours, targetHours) => {
  const progress = targetHours > 0 ? Math.min(1, workedHours / targetHours) : 0;
  const percentage = Math.round(progress * 100);

  return `${percentage}% ${Math.floor(workedHours)}h/${targetHours}h`;
};

export const createLabeledBarSegments = ({
  text,
  filled,
  filledColor,
  width = BAR_WIDTH,
}) => {
  const label = String(text).slice(0, width);
  const leftPadding = Math.floor((width - label.length) / 2);
  const centeredText = label.padStart(label.length + leftPadding).padEnd(width);
  const filledWidth = Math.max(0, Math.min(width, filled));

  return [
    {
      text: centeredText.slice(0, filledWidth),
      backgroundColor: filledColor,
      color: getContrastColor(filledColor),
    },
    {
      text: centeredText.slice(filledWidth),
      backgroundColor: EMPTY_BACKGROUND_COLOR,
      color: getContrastColor(EMPTY_BACKGROUND_COLOR),
    },
  ];
};
