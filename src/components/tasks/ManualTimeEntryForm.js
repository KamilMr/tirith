import React, {useState} from 'react';
import AutocompleteTextInput from '../AutocompleteTextInput.js';
import VimTextInput from '../VimTextInput.js';
import {
  createManualTimeEntryFormState,
  selectManualTimeTask,
  createManualTimeEntrySubmission,
} from './manualTimeEntryFormState.js';

const ManualTimeEntryForm = ({taskTitle, projectId, onSubmit, onCancel}) => {
  const [formState, setFormState] = useState(() =>
    createManualTimeEntryFormState(taskTitle),
  );

  if (formState.step === 'task') {
    return (
      <AutocompleteTextInput
        label="Task name"
        defaultValue={formState.defaultTitle}
        projectId={projectId}
        onSubmit={title =>
          setFormState(current => selectManualTimeTask(current, title))
        }
        onCancel={onCancel}
      />
    );
  }

  return (
    <VimTextInput
      label={`Add manual time for "${formState.title}"`}
      defaultValue=""
      onSubmit={input =>
        onSubmit(createManualTimeEntrySubmission(formState, input))
      }
      onCancel={onCancel}
      placeholder="35m | 15:33 35m | now 35m"
    />
  );
};

export default ManualTimeEntryForm;
