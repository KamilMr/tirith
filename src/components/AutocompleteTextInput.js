import React, {useState, useEffect} from 'react';
import {Text, Box, useInput} from 'ink';
import {useNavigation} from '../contexts/NavigationContext.js';
import Fuse from 'fuse.js';
import taskService from '../services/taskService.js';
import ScrollBox from './ScrollBox.js';

const MAX_VISIBLE_SUGGESTIONS = 10;

const AutocompleteTextInput = ({
  defaultValue = '',
  projectId,
  onSubmit,
  onCancel,
  label = '',
}) => {
  const [value, setValue] = useState(defaultValue);
  const [allSuggestions, setAllSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const {setInputLocked} = useNavigation();

  // Fetch suggestions on mount
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (projectId) {
        const suggestions = await taskService.getTaskSuggestions(projectId);
        setAllSuggestions(suggestions);
      }
    };

    setInputLocked(true);
    setValue(defaultValue);
    fetchSuggestions();

    return () => setInputLocked(false);
  }, [setInputLocked, defaultValue, projectId]);

  // Filter suggestions whenever value changes
  useEffect(() => {
    if (allSuggestions.length === 0) {
      setFilteredSuggestions([]);
      setSelectedIndex(0);
      return;
    }

    if (!value.trim()) {
      setFilteredSuggestions(allSuggestions);
      setSelectedIndex(0);
      return;
    }

    const fuse = new Fuse(allSuggestions, {
      threshold: 0.4,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });

    const results = fuse.search(value);
    const matches = results.map(result => result.item);
    setFilteredSuggestions(matches);
    setSelectedIndex(0);
  }, [value, allSuggestions]);

  useInput((input, key) => {
    // Handle arrow navigation only when suggestions are visible
    if (filteredSuggestions.length > 0) {
      if (key.downArrow) {
        setSelectedIndex(prev =>
          Math.min(prev + 1, filteredSuggestions.length - 1),
        );
        return;
      }

      if (key.upArrow) {
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        return;
      }

      // Tab to accept selected suggestion
      if (key.tab) {
        setValue(filteredSuggestions[selectedIndex]);
        return;
      }
    }

    if (key.return) {
      setInputLocked(false);
      onSubmit(value);
      setValue('');
      return;
    }

    if (key.escape) {
      setInputLocked(false);
      onCancel();
      setValue('');
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

  return (
    <Box flexDirection="column">
      {label && (
        <Text color="cyan" bold>
          {label}
        </Text>
      )}
      <Text>
        {value}
        <Text inverse> </Text>
      </Text>
      {filteredSuggestions.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <ScrollBox
            height={MAX_VISIBLE_SUGGESTIONS}
            selectedIndex={selectedIndex}
          >
            {filteredSuggestions.map((suggestion, index) => (
              <Text
                key={index}
                color={index === selectedIndex ? 'green' : 'gray'}
              >
                {index === selectedIndex ? '→ ' : '  '}
                {suggestion}
              </Text>
            ))}
          </ScrollBox>
        </Box>
      )}
    </Box>
  );
};

export default AutocompleteTextInput;
