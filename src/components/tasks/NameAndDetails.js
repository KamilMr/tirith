import React from 'react';
import {Text, Box} from 'ink';
import {formatEstimation} from '../../utils.js';
import MetadataBadges from './MetadataBadges.js';

const NameAndDetails = ({task, isSelected}) => {
  const estimationDisplay = formatEstimation(task.estimatedMinutes);
  const baseColor = isSelected ? 'green' : 'white';

  return (
    <Box flexDirection="column">
      <Text color={baseColor} wrap="wrap">
        {task.isActive ? '▶ ' : isSelected ? '• ' : '  '}
        {task.title}
      </Text>

      <Text>
        {'  '}
        {estimationDisplay && <Text dimColor>(est: {estimationDisplay})</Text>}
        <MetadataBadges
          epic={task.epic}
          category={task.category}
          isExploration={task.isExploration}
          scope={task.scope}
          dimmed={!isSelected}
        />
      </Text>
    </Box>
  );
};

export default NameAndDetails;
