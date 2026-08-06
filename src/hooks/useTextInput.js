import {useState, useEffect} from 'react';
import {useInput} from 'ink';
import {useNavigation} from '../contexts/NavigationContext.js';

const useTextInput = ({defaultValue = '', onSubmit, onCancel}) => {
  const [value, setValue] = useState(defaultValue);
  const {setMode} = useNavigation();

  useEffect(() => {
    setMode('insert');
    setValue(defaultValue);
  }, [setMode, defaultValue]);

  useInput((input, key) => {
    if (key.return) {
      onSubmit(value);
      setValue('');
      setMode('normal');
      return;
    }

    if (key.escape) {
      onCancel();
      setValue('');
      setMode('normal');
      return;
    }

    if (key.backspace || key.delete) {
      setValue(prev => prev.slice(0, -1));
      return;
    }

    if (input && !key.ctrl && !key.meta) {
      setValue(prev => prev + input);
    }
  });

  return value;
};

export default useTextInput;
