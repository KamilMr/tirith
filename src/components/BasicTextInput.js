import React from 'react';
import {Text} from 'ink';
import useTextInput from '../hooks/useTextInput.js';

const BasicTextInput = ({defaultValue = '', onSubmit, onCancel}) => {
  const value = useTextInput({defaultValue, onSubmit, onCancel});

  return (
    <Text>
      {value}
      <Text inverse> </Text>
    </Text>
  );
};

export default BasicTextInput;
