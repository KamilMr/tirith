import React, {createContext, useContext, useState, useRef} from 'react';
import {useInput, useApp} from 'ink';
import {
  VIEW,
  CLIENT,
  PROJECTS,
  TASKS,
  mapViewsToNum,
  componentTitles,
} from '../consts.js';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context)
    throw new Error('useNavigation must be used within NavigationProvider');
  return context;
};

export const NavigationProvider = ({children}) => {
  const [focusedSection, setFocusedSection] = useState(CLIENT);
  const [mode, setMode] = useState('normal');
  const [inputLocked, setInputLocked] = useState(false);

  const {exit} = useApp();
  const componentKeyHandlers = useRef(new Map());

  useInput((input, key) => {
    // When input is locked, completely ignore all keys (forms handle their own input)
    if (inputLocked) return;

    const currentHandler = componentKeyHandlers.current.get(focusedSection);
    const specialKey = key.escape ? 'escape' : key.return ? 'return' : null;

    if (currentHandler && specialKey && currentHandler[specialKey]) {
      currentHandler[specialKey]();
      return;
    }

    if (key.escape) {
      setMode('normal');
      return;
    }

    if (input === 'q' && mode === 'normal') exit();

    if (mode !== 'normal') return;

    // Component handlers get priority over global keys
    if (currentHandler && currentHandler[input]) {
      currentHandler[input]();
      return;
    }

    if (key.tab) {
      const sections = [VIEW, CLIENT, PROJECTS, TASKS];
      const currentIndex = sections.indexOf(focusedSection);
      const nextIndex = (currentIndex + 1) % sections.length;
      setFocusedSection(sections[nextIndex]);
    }

    if (input === '0') setFocusedSection(VIEW);
    if (input === '1') setFocusedSection(CLIENT);
    if (input === '2') setFocusedSection(PROJECTS);
    if (input === '3') setFocusedSection(TASKS);
  });

  const registerKeyHandler = (componentId, keyHandler) => {
    componentKeyHandlers.current.set(componentId, keyHandler);
  };

  const unregisterKeyHandler = componentId => {
    componentKeyHandlers.current.delete(componentId);
  };

  const getBorderTitle = componentName => {
    const navKey = mapViewsToNum[componentName];
    const title = componentTitles[componentName];
    return `[${navKey}] ${title}`;
  };

  const value = {
    focusedSection,
    currentView: mapViewsToNum[focusedSection],
    isViewFocused: focusedSection === VIEW,
    isClientFocused: focusedSection === CLIENT,
    isProjectsFocused: focusedSection === PROJECTS,
    isTasksFocused: focusedSection === TASKS,
    mode,
    setMode,
    inputLocked,
    setInputLocked,
    registerKeyHandler,
    unregisterKeyHandler,
    getBorderTitle,
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};
