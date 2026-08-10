export const createManualTimeEntryFormState = taskTitle => ({
  step: 'task',
  defaultTitle: taskTitle || '',
  title: null,
});

export const selectManualTimeTask = (state, title) => {
  const cleanedTitle = title.trim();
  if (!cleanedTitle) return state;

  return {
    ...state,
    step: 'duration',
    title: cleanedTitle,
  };
};

export const createManualTimeEntrySubmission = (state, input) => ({
  title: state.title,
  input,
});
