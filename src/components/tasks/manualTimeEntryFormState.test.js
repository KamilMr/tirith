import {describe, expect, it} from 'vitest';
import {
  createManualTimeEntryFormState,
  selectManualTimeTask,
  createManualTimeEntrySubmission,
} from './manualTimeEntryFormState.js';

describe('manual time entry form state', () => {
  it('starts with the selected task title ready for editing', () => {
    expect(createManualTimeEntryFormState('Selected task')).toEqual({
      step: 'task',
      defaultTitle: 'Selected task',
      title: null,
    });
  });

  it('starts with an empty title when no task is selected', () => {
    expect(createManualTimeEntryFormState()).toEqual({
      step: 'task',
      defaultTitle: '',
      title: null,
    });
  });

  it('moves to duration entry with a cleaned task title', () => {
    const initial = createManualTimeEntryFormState('Selected task');

    expect(selectManualTimeTask(initial, '  Replacement task  ')).toEqual({
      step: 'duration',
      defaultTitle: 'Selected task',
      title: 'Replacement task',
    });
  });

  it('keeps asking for a task when the title is empty', () => {
    const initial = createManualTimeEntryFormState();

    expect(selectManualTimeTask(initial, '   ')).toBe(initial);
  });

  it('combines the chosen title with the entered minutes', () => {
    const state = selectManualTimeTask(
      createManualTimeEntryFormState(),
      'Replacement task',
    );

    expect(createManualTimeEntrySubmission(state, '20m')).toEqual({
      title: 'Replacement task',
      input: '20m',
    });
  });
});
