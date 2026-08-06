import React from 'react';
import {Text, Box} from 'ink';
import useTextInput from '../hooks/useTextInput.js';

const TextInput = ({title, placeholder = '', onSubmit, onCancel}) => {
  const value = useTextInput({onSubmit, onCancel});

  return (
    <Box
      borderStyle="double"
      borderColor="yellow"
      flexDirection="column"
      padding={1}
      width={60}
      height={10}
    >
      <Text bold color="yellow">
        {title}
      </Text>
      <Text dimColor>{placeholder}</Text>
      <Box borderStyle="single" borderColor="gray" marginTop={1} padding={1}>
        <Text>
          {value}
          <Text inverse> </Text>
        </Text>
      </Box>
      <Text dimColor marginTop={1}>
        Enter: Submit | Esc: Cancel
      </Text>
    </Box>
  );
};

export default TextInput;
