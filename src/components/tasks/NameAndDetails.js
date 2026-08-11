import React from 'react';
import {Text} from 'ink';
import {formatEstimation} from '../../utils.js';
import MetadataBadges from './MetadataBadges.js';

const NameAndDetails = ({task, isSelected}) => {
  const estimationDisplay = formatEstimation(task.estimatedMinutes);
  const baseColor = isSelected ? 'green' : 'white';

  return (
    <Text color={baseColor} wrap="wrap">
      {task.isActive ? '▶ ' : isSelected ? '• ' : '  '}
      {task.title}
      {estimationDisplay && (
        <Text dimColor> (est: {estimationDisplay})</Text>
      )}
      <MetadataBadges
        epic={task.epic}
        category={task.category}
        isExploration={task.isExploration}
        scope={task.scope}
        dimmed={!isSelected}
      />
    </Text>
  );
};

export default NameAndDetails;
