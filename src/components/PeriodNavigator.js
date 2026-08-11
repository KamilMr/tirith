import React from 'react';
import {Box, Text} from 'ink';

const PeriodNavigator = ({rangeLabel, periodLabel, controls}) => (
  <Box marginBottom={1}>
    <Text dimColor>{rangeLabel}: </Text>
    <Text color="green" bold>
      [{periodLabel}]
    </Text>
    {controls && <Text dimColor> ({controls})</Text>}
  </Box>
);

export default PeriodNavigator;
