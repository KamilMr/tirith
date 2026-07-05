import React from 'react';
import VimTextInput from '../VimTextInput.js';

const ManualTimeEntryForm = ({taskTitle, onSubmit, onCancel}) => {
  return (
    <VimTextInput
      label={`Add manual time for "${taskTitle}"`}
      defaultValue=""
      onSubmit={onSubmit}
      onCancel={onCancel}
      placeholder="35m | 15:33 35m | now 35m"
    />
  );
};

export default ManualTimeEntryForm;
