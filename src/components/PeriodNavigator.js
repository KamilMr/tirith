import React from 'react';
import {Box, Text} from 'ink';

const PeriodNavigator = ({
  rangeLabel,
  periodLabel,
  controls,
  isFocused = false,
}) => (
  <Box marginBottom={1}>
    <Text color={isFocused ? 'green' : undefined}>
      {isFocused ? '› ' : '  '}
    </Text>
    <Text dimColor>{rangeLabel}: </Text>
    <Text color={isFocused ? 'green' : undefined} bold={isFocused}>
      [{periodLabel}]
    </Text>
    {controls && <Text dimColor> ({controls})</Text>}
  </Box>
);

export default PeriodNavigator;
