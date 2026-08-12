import React from 'react';
import {Box} from 'ink';
import Client from './components/clients.js';
import Projects from './components/projects.js';
import Tasks from './components/tasks.js';
import View from './components/view.js';
import StatusBar from './components/StatusBar.js';
import {
  NavigationProvider,
  useNavigation,
} from './contexts/NavigationContext.js';
import {DataProvider} from './contexts/DataContext.js';
import useTerminalSize from './hooks/useTerminalSize.js';
import {getAppHeights, getSidebarHeights} from './layout/sidebarLayout.js';
import pkg from '../package.json' with {type: 'json'};

const LAYOUT = {
  leftColumnWidth: 40,
};

const AppContent = () => {
  const [, rows] = useTerminalSize();
  const {focusedSection, activeSidebarSection} = useNavigation();
  const {renderHeight, mainHeight} = getAppHeights(rows);
  const {clientHeight, projectHeight, taskHeight} = getSidebarHeights({
    mainHeight,
    focusedSection,
    activeSidebarSection,
  });

  return (
    <Box height={renderHeight} flexDirection="column">
      <StatusBar version={pkg.version} />
      <Box height={mainHeight}>
        <Box width={`${LAYOUT.leftColumnWidth}%`} flexDirection="column">
          <Client height={clientHeight} />
          <Projects height={projectHeight} />
          <Tasks height={taskHeight} />
        </Box>
        <Box flexGrow={1}>
          <View height={mainHeight} />
        </Box>
      </Box>
    </Box>
  );
};

const App = () => (
  <DataProvider>
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  </DataProvider>
);

export default App;
