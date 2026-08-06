import {beforeEach, describe, expect, it, vi} from 'vitest';

const harness = vi.hoisted(() => ({
  effectDependencies: [],
  inputHandler: null,
  stateIndex: 0,
  states: [],
  effectIndex: 0,
  setMode: null,
}));

vi.mock('react', () => ({
  useState: initialValue => {
    const index = harness.stateIndex++;

    if (!Object.hasOwn(harness.states, index)) {
      harness.states[index] = initialValue;
    }

    const setValue = value => {
      harness.states[index] =
        typeof value === 'function' ? value(harness.states[index]) : value;
    };

    return [harness.states[index], setValue];
  },
  useEffect: (effect, dependencies) => {
    const index = harness.effectIndex++;
    const previousDependencies = harness.effectDependencies[index];
    const changed =
      !previousDependencies ||
      dependencies.some(
        (dependency, dependencyIndex) =>
          dependency !== previousDependencies[dependencyIndex],
      );

    harness.effectDependencies[index] = dependencies;
    if (changed) effect();
  },
}));

vi.mock('ink', () => ({
  useInput: handler => {
    harness.inputHandler = handler;
  },
}));

vi.mock('../contexts/NavigationContext.js', () => ({
  useNavigation: () => ({setMode: harness.setMode}),
}));

import useTextInput from './useTextInput.js';

const render = props => {
  harness.stateIndex = 0;
  harness.effectIndex = 0;
  return useTextInput(props);
};

const key = properties => properties;

describe('useTextInput', () => {
  beforeEach(() => {
    harness.effectDependencies = [];
    harness.inputHandler = null;
    harness.states = [];
    harness.setMode = vi.fn();
  });

  it('initializes from and resets to the supplied default value in insert mode', () => {
    const props = {defaultValue: 'draft', onSubmit: vi.fn(), onCancel: vi.fn()};

    expect(render(props)).toBe('draft');
    expect(harness.setMode).toHaveBeenCalledWith('insert');

    harness.inputHandler('!', key({}));
    expect(render(props)).toBe('draft!');

    const updatedProps = {...props, defaultValue: 'updated'};
    render(updatedProps);
    expect(render(updatedProps)).toBe('updated');
    expect(harness.setMode).toHaveBeenLastCalledWith('insert');
  });

  it('handles ordinary input, modifier filtering, and deletion', () => {
    const props = {onSubmit: vi.fn(), onCancel: vi.fn()};

    expect(render(props)).toBe('');
    harness.inputHandler('a', key({}));
    expect(render(props)).toBe('a');

    harness.inputHandler('b', key({ctrl: true}));
    harness.inputHandler('c', key({meta: true}));
    expect(render(props)).toBe('a');

    harness.inputHandler('', key({backspace: true}));
    expect(render(props)).toBe('');

    harness.inputHandler('d', key({}));
    render(props);
    harness.inputHandler('', key({delete: true}));
    expect(render(props)).toBe('');
  });

  it('submits or cancels before clearing and returning to normal mode', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    const props = {onSubmit, onCancel};

    render(props);
    harness.inputHandler('value', key({}));
    render(props);
    harness.inputHandler('ignored', key({return: true, escape: true}));

    expect(onSubmit).toHaveBeenCalledWith('value');
    expect(onCancel).not.toHaveBeenCalled();
    expect(harness.setMode).toHaveBeenLastCalledWith('normal');
    expect(render(props)).toBe('');

    harness.inputHandler('value', key({}));
    render(props);
    harness.inputHandler('', key({escape: true}));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(harness.setMode).toHaveBeenLastCalledWith('normal');
    expect(render(props)).toBe('');
  });
});
