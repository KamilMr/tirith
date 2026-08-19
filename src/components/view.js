import React, {useEffect, useState} from 'react';
import {Text, Box} from 'ink';
import {useNavigation} from '../contexts/NavigationContext.js';
import {useData} from '../contexts/DataContext.js';
import {BORDER_COLOR_DEFAULT, BORDER_COLOR_FOCUSED, VIEW} from '../consts.js';
import Frame from './Frame.js';
import HelpBottom from './HelpBottom.js';
import projectService from '../services/projectService.js';
import taskService from '../services/taskService.js';
import clientService from '../services/clientService.js';
import timeEntryModel from '../models/timeEntry.js';
import {useComponentKeys} from '../hooks/useComponentKeys.js';
import useScrollableList from '../hooks/useScrollableList.js';
import useTaskAnalytics from '../hooks/useTaskAnalytics.js';
import usePricing from '../hooks/usePricing.js';
import useEditorBuffer from '../hooks/useEditorBuffer.js';
import {
  moveTimeEntryByMinutes,
  resizeTimeEntryEndByMinutes,
  roundTimeEntryToFiveMinutes,
} from '../services/timeEntryDraft.js';
import KeyValue from './KeyValue.js';
import RangeSelector from './RangeSelector.js';
import PeriodNavigator from './PeriodNavigator.js';
import Earnings from './Earnings.js';
import SelectableList from './SelectableList.js';
import TaskTimeEntries from './TaskTimeEntries.js';
import {LiveClientDetails, LivePeriodSummary} from './ViewLiveMetrics.js';
import SelectedTaskSummary from './SelectedTaskSummary.js';
import {loadTaskViewEntries} from './viewTaskEntries.js';
import {
  VIEW_RANGE_OPTIONS,
  formatViewPeriod,
  getViewDateRange,
  moveViewLevel,
  moveViewPeriod,
  moveViewRangeIndex,
} from './viewRange.js';

const View = ({height, width = 120}) => {
  const {
    isViewFocused,
    isClientFocused,
    isProjectsFocused,
    isTasksFocused,
    getBorderTitle,
  } = useNavigation();
  const {
    selectedClientId,
    selectedProjectId,
    selectedTaskId,
    reload,
    triggerReload,
  } = useData();

  const [clients, setClients] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [taskDetails, setTaskDetails] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [draftEntry, setDraftEntry] = useState(null);
  const [lastSection, setLastSection] = useState(null);
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(0);
  const [rangeAnchor, setRangeAnchor] = useState(() => new Date());
  const [viewLevel, setViewLevel] = useState('range');

  const isCompact = width < 95;
  const selectedRange = VIEW_RANGE_OPTIONS[selectedRangeIndex];
  const currentRange = getViewDateRange(selectedRange.type, rangeAnchor);
  const periodLabel = formatViewPeriod(selectedRange.type, rangeAnchor);

  useEffect(() => {
    if (isClientFocused) setLastSection('client');
    else if (isProjectsFocused) setLastSection('project');
    else if (isTasksFocused) setLastSection('task');
  }, [isClientFocused, isProjectsFocused, isTasksFocused]);

  const taskProject = allProjects.find(p => p.id === taskDetails?.project_id);
  const taskClient = clients.find(c => c.id === taskProject?.client_id);
  const selectedTaskEntries = timeEntries.filter(
    entry => entry.task_id === selectedTaskId,
  );

  const {
    selectedIndex: selectedEntryIndex,
    selectNext: selectNextEntry,
    selectPrevious: selectPreviousEntry,
  } = useScrollableList(selectedTaskEntries, {wrap: true});
  const {analytics, loading: analyticsLoading} = useTaskAnalytics(
    selectedTaskId,
    currentRange.startDate,
    currentRange.endDate,
  );
  const {pricing: projectPricing, loading: projectPricingLoading} = usePricing(
    null,
    selectedProjectId,
    null,
    currentRange.startDate,
    currentRange.endDate,
    reload,
  );
  useEffect(() => {
    const loadInitialData = async () => {
      const [clientData, projectData] = await Promise.all([
        clientService.selectAll(),
        projectService.selectAll(),
      ]);
      setClients(clientData);
      setAllProjects(projectData);
    };
    loadInitialData();
  }, [reload]);

  useEffect(() => {
    if (isTasksFocused) {
      taskService.selectAll().then(setAllTasks);
    }
  }, [isTasksFocused, reload]);

  useEffect(() => {
    if (selectedTaskId && (isTasksFocused || isViewFocused)) {
      const loadTaskDetails = async () => {
        const task = await taskService.selectById(selectedTaskId);
        setTaskDetails(task);
        if (!task) {
          setTimeEntries([]);
          return;
        }
        const entries = await loadTaskViewEntries({
          task,
          projects: allProjects,
          startDate: currentRange.startDate,
          endDate: currentRange.endDate,
        });
        setTimeEntries((entries || []).reverse());
      };
      loadTaskDetails();
    } else if (!selectedTaskId) {
      setTaskDetails(null);
      setTimeEntries([]);
    }
  }, [
    isTasksFocused,
    isViewFocused,
    selectedTaskId,
    reload,
    currentRange.startDate,
    currentRange.endDate,
  ]);

  const deleteSelectedEntry = async () => {
    if (selectedTaskEntries.length === 0) return;
    const entryToDelete = selectedTaskEntries[selectedEntryIndex];
    await timeEntryModel.delete(entryToDelete.id);
    setTimeEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
    triggerReload();
  };

  const {openEditor} = useEditorBuffer(triggerReload);

  const startEntryAdjustment = () => {
    if (selectedTaskEntries.length === 0) return;

    const entryToAdjust = selectedTaskEntries[selectedEntryIndex];
    if (!entryToAdjust?.end) return;

    setDraftEntry(roundTimeEntryToFiveMinutes(entryToAdjust));
  };

  const roundDraftEntry = () => {
    setDraftEntry(prev => roundTimeEntryToFiveMinutes(prev));
  };

  const moveDraftEntry = minutes => {
    setDraftEntry(prev => moveTimeEntryByMinutes(prev, minutes));
  };

  const resizeDraftEntry = minutes => {
    setDraftEntry(prev => resizeTimeEntryEndByMinutes(prev, minutes));
  };

  const cancelEntryAdjustment = () => {
    setDraftEntry(null);
  };

  const saveDraftEntry = async () => {
    if (!draftEntry) return;

    await timeEntryModel.update({
      id: draftEntry.id,
      start: draftEntry.start,
      end: draftEntry.end,
    });

    setTimeEntries(prev =>
      prev.map(entry =>
        entry.id === draftEntry.id
          ? {...entry, start: draftEntry.start, end: draftEntry.end}
          : entry,
      ),
    );
    setDraftEntry(null);
    triggerReload();
  };

  const handleEditorOpen = () => {
    if (selectedTaskEntries.length === 0) return;
    openEditor(selectedTaskEntries, taskDetails?.title || 'Selected Task');
  };

  const selectRange = direction => {
    setSelectedRangeIndex(prev => moveViewRangeIndex(prev, direction));
    setRangeAnchor(new Date());
  };
  const selectPreviousPeriod = () =>
    setRangeAnchor(prev => moveViewPeriod(selectedRange.type, prev, -1));
  const selectNextPeriod = () =>
    setRangeAnchor(prev => moveViewPeriod(selectedRange.type, prev, 1));
  const selectCurrentPeriod = () => setRangeAnchor(new Date());
  const openNextViewLevel = () => setViewLevel(prev => moveViewLevel(prev, 1));
  const closeViewLevel = () => setViewLevel(prev => moveViewLevel(prev, -1));

  const activeSection = isViewFocused
    ? lastSection
    : isClientFocused
      ? 'client'
      : isProjectsFocused
        ? 'project'
        : 'task';

  const isAdjustingEntry = !!draftEntry;

  let keyMappings;
  if (viewLevel === 'range')
    keyMappings = [
      {key: 'h', action: () => selectRange(-1)},
      {key: 'l', action: () => selectRange(1)},
      {key: 't', action: selectCurrentPeriod},
      {key: 'return', action: openNextViewLevel},
    ];
  else if (viewLevel === 'period')
    keyMappings = [
      {key: 'h', action: selectPreviousPeriod},
      {key: 'l', action: selectNextPeriod},
      {key: 't', action: selectCurrentPeriod},
      {key: 'return', action: openNextViewLevel},
      {key: 'escape', action: closeViewLevel},
    ];
  else if (
    activeSection === 'task' &&
    selectedTaskId &&
    taskDetails &&
    draftEntry
  )
    keyMappings = [
      {key: 'j', action: () => moveDraftEntry(5)},
      {key: 'k', action: () => moveDraftEntry(-5)},
      {key: 'J', action: () => moveDraftEntry(30)},
      {key: 'K', action: () => moveDraftEntry(-30)},
      {key: 'l', action: () => resizeDraftEntry(5)},
      {key: 'h', action: () => resizeDraftEntry(-5)},
      {key: 'L', action: () => resizeDraftEntry(30)},
      {key: 'H', action: () => resizeDraftEntry(-30)},
      {key: 'r', action: roundDraftEntry},
      {key: 'return', action: saveDraftEntry},
      {key: 'escape', action: cancelEntryAdjustment},
    ];
  else if (activeSection === 'task' && selectedTaskId && taskDetails)
    keyMappings = [
      {key: 'j', action: selectNextEntry},
      {key: 'k', action: selectPreviousEntry},
      {key: 'd', action: deleteSelectedEntry},
      {key: 'e', action: handleEditorOpen},
      {key: 'm', action: startEntryAdjustment},
      {key: 't', action: selectCurrentPeriod},
      {key: 'escape', action: closeViewLevel},
    ];
  else
    keyMappings = [
      {key: 't', action: selectCurrentPeriod},
      {key: 'escape', action: closeViewLevel},
    ];

  useComponentKeys(VIEW, keyMappings, isViewFocused);

  const borderColor = isViewFocused
    ? BORDER_COLOR_FOCUSED
    : BORDER_COLOR_DEFAULT;
  const title = getBorderTitle(VIEW);

  const renderTaskDetails = () => (
    <Box flexDirection="column">
      {renderDashboard()}
      <Box marginTop={1}>
        {taskDetails ? (
          <SelectedTaskSummary
            task={taskDetails}
            project={taskProject}
            client={taskClient}
            timeEntries={selectedTaskEntries}
            analytics={analytics}
            analyticsLoading={analyticsLoading}
            startDate={currentRange.startDate}
            endDate={currentRange.endDate}
            reload={reload}
            compact={isCompact}
          />
        ) : (
          <Text dimColor>Loading selected task...</Text>
        )}
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <TaskTimeEntries
          height={height}
          timeEntries={selectedTaskEntries}
          overlapEntries={timeEntries}
          selectedEntryIndex={selectedEntryIndex}
          isViewFocused={isViewFocused}
          selectedTaskId={selectedTaskId}
          draftEntry={draftEntry}
          compact={isCompact}
        />
      </Box>
    </Box>
  );

  const renderProjectDetails = () => {
    const project = allProjects.find(p => p.id === selectedProjectId);
    if (!project) return <Text dimColor>Loading...</Text>;

    const client = clients.find(c => c.id === project.client_id);

    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          <Box width={30}>
            <KeyValue
              label="Project Details:"
              items={[
                {key: 'Name', value: project.name},
                {key: 'Client', value: client?.name || 'Unknown'},
              ]}
            />
          </Box>
          <Box width={30} marginLeft={2}>
            <Earnings
              pricing={projectPricing}
              loading={projectPricingLoading}
            />
          </Box>
        </Box>
      </Box>
    );
  };

  const renderClientDetails = () => {
    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return <Text dimColor>Loading...</Text>;

    return (
      <Box flexDirection="column">
        <Box flexDirection="row">
          <Box width={30}>
            <KeyValue
              label="Client Details:"
              items={[{key: 'Name', value: client.name}]}
            />
          </Box>
          <LiveClientDetails
            clientId={selectedClientId}
            rangeType={selectedRange.type}
            startDate={currentRange.startDate}
            endDate={currentRange.endDate}
            reload={reload}
            rangeLabel={selectedRange.label}
          />
        </Box>
      </Box>
    );
  };

  const renderDashboard = () => (
    <LivePeriodSummary
      rangeType={selectedRange.type}
      startDate={currentRange.startDate}
      endDate={currentRange.endDate}
      reload={reload}
      rangeLabel={selectedRange.label}
      periodLabel={periodLabel}
      compact={isCompact}
    />
  );

  const renderContent = () => {
    if (isClientFocused) {
      if (selectedClientId) return renderClientDetails();
      if (clients.length > 0) {
        return (
          <SelectableList
            label="All Clients:"
            items={clients}
            selectedId={selectedClientId}
            getId={c => c.id}
            renderLabel={c => c.name}
          />
        );
      }
      return <Text dimColor>No clients found</Text>;
    }

    if (isProjectsFocused) {
      if (selectedProjectId) return renderProjectDetails();
      if (allProjects.length === 0)
        return <Text dimColor>No projects found</Text>;

      return (
        <SelectableList
          label="All Projects:"
          items={allProjects}
          selectedId={selectedProjectId}
          getId={p => p.id}
          renderLabel={p => {
            const client = clients.find(c => c.id === p.client_id);
            return (
              <>
                {p.name}
                {client && <Text dimColor> ({client.name})</Text>}
              </>
            );
          }}
        />
      );
    }

    if (isTasksFocused) {
      if (selectedTaskId) return renderTaskDetails();
      if (allTasks.length === 0) return <Text dimColor>No tasks found</Text>;

      return (
        <SelectableList
          label="All Tasks:"
          items={allTasks.slice(0, 10)}
          selectedId={selectedTaskId}
          getId={t => t.id}
          renderLabel={t => {
            const project = allProjects.find(p => p.id === t.project_id);
            const client = clients.find(c => c.id === project?.client_id);
            return (
              <>
                {t.title}
                {project && <Text dimColor> ({project.name}</Text>}
                {client && <Text dimColor> - {client.name})</Text>}
              </>
            );
          }}
        />
      );
    }

    if (isViewFocused) {
      if (lastSection === 'client' && selectedClientId)
        return renderClientDetails();
      if (lastSection === 'project' && selectedProjectId)
        return renderProjectDetails();
      if (selectedTaskId) return renderTaskDetails();
    }

    return renderDashboard();
  };

  const hasTimeEntries = selectedTaskEntries.length > 0;

  return (
    <Frame borderColor={borderColor} width={'100%'} height={height}>
      <Frame.Header>
        <Text color={borderColor} bold>
          {title}
          {taskDetails && (isTasksFocused || isViewFocused) && (
            <Text dimColor> - {taskDetails.title}</Text>
          )}
          {isProjectsFocused && selectedProjectId && (
            <Text dimColor>
              {' '}
              - {allProjects.find(p => p.id === selectedProjectId)?.name}
            </Text>
          )}
          {isClientFocused && selectedClientId && (
            <Text dimColor>
              {' '}
              - {clients.find(c => c.id === selectedClientId)?.name}
            </Text>
          )}
        </Text>
      </Frame.Header>
      <Frame.Body>
        <Box flexDirection="column">
          <RangeSelector
            options={VIEW_RANGE_OPTIONS}
            selectedIndex={selectedRangeIndex}
            controls={null}
            isFocused={isViewFocused && viewLevel === 'range'}
          />
          <PeriodNavigator
            rangeLabel={selectedRange.label}
            periodLabel={periodLabel}
            controls={null}
            isFocused={isViewFocused && viewLevel === 'period'}
          />
          {renderContent()}
        </Box>
      </Frame.Body>
      <Frame.Footer>
        {isViewFocused && viewLevel === 'range' && (
          <HelpBottom>h/l:range Enter:choose t:current</HelpBottom>
        )}
        {isViewFocused && viewLevel === 'period' && (
          <HelpBottom>h/l:period t:current Enter:open Esc:back</HelpBottom>
        )}
        {isViewFocused && viewLevel === 'detail' && isAdjustingEntry && (
          <HelpBottom>
            j/k:move5 J/K:move30 h/l:duration5 H/L:duration30 r:round Enter:save
            Esc:cancel
          </HelpBottom>
        )}
        {isViewFocused &&
          viewLevel === 'detail' &&
          !isAdjustingEntry &&
          activeSection === 'task' &&
          selectedTaskId &&
          (hasTimeEntries ? (
            <HelpBottom>
              j/k:entries m:move e:edit d:delete t:current Esc:back
            </HelpBottom>
          ) : (
            <HelpBottom>t:current Esc:back</HelpBottom>
          ))}
        {isViewFocused &&
          viewLevel === 'detail' &&
          !(activeSection === 'task' && selectedTaskId) && (
            <HelpBottom>t:current Esc:back</HelpBottom>
          )}
      </Frame.Footer>
    </Frame>
  );
};

export default View;
