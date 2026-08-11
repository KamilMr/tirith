import React from 'react';
import {Text, Box} from 'ink';

const NoTasksFound = ({projectName}) => (
  <Box flexDirection="column">
    <Text dimColor>No tasks for {projectName}</Text>
    <Text dimColor>Press 'c' to create a new task</Text>
  </Box>
);

export default NoTasksFound;
