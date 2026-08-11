import React from 'react';
import {Text, Box} from 'ink';

const RangeSelector = ({
  options,
  selectedIndex,
  controls = 'h/l to change',
  isFocused = false,
}) => (
  <Box marginBottom={1}>
    <Text color={isFocused ? 'green' : undefined}>
      {isFocused ? '› ' : '  '}
    </Text>
    <Text dimColor>Range: </Text>
    {options.map((option, index) => (
      <Text key={option.label}>
        {index === selectedIndex ? (
          <Text color={isFocused ? 'green' : undefined} bold={isFocused}>
            [{option.label}]
          </Text>
        ) : (
          <Text dimColor> {option.label} </Text>
        )}
      </Text>
    ))}
    <Text dimColor> ({controls})</Text>
  </Box>
);

export default RangeSelector;
