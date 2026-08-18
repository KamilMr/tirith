import React, {useEffect, useState} from 'react';
import {Text, Box} from 'ink';
import {useNavigation} from '../contexts/NavigationContext.js';
import {useData} from '../contexts/DataContext.js';
import {BORDER_COLOR_DEFAULT, BORDER_COLOR_FOCUSED, VIEW} from '../consts.js';
import Frame from './Frame.js';
import HelpBottom from './HelpBottom.js';
import ScrollBox from './ScrollBox.js';
import projectService from '../services/projectService.js';
import taskService from '../services/taskService.js';
import clientService from '../services/clientService.js';
import timeEntryModel from '../models/timeEntry.js';
import {useComponentKeys} from '../hooks/useComponentKeys.js';
import useScrollableList from '../hooks/useScrollableList.js';
import useTaskAnalytics from '../hooks/useTaskAnalytics.js';
import usePricing from '../hooks/usePricing.js';
import useTotalEarnings from '../hooks/useTotalEarnings.js';
import useEditorBuffer from '../hooks/useEditorBuffer.js';
import useLiveClientMetrics from '../hooks/useLiveClientMetrics.js';
import useLiveNow from '../hooks/useLiveNow.js';
import usePeriodSummary from '../hooks/usePeriodSummary.js';
import {findTimeEntryOverlaps} from '../services/timeEntryOverlap.js';
import {formatTimeEntryOverlapSummary} from '../services/timeEntryOverlapSummary.js';
import {
  moveTimeEntryByMinutes,
  resizeTimeEntryEndByMinutes,
  roundTimeEntryToFiveMinutes,
} from '../services/timeEntryDraft.js';
import KeyValue from './KeyValue.js';
import RangeSelector from './RangeSelector.js';
import PeriodNavigator from './PeriodNavigator.js';
import Earnings from './Earnings.js';
import WorkTargets from './WorkTargets.js';
import PeriodSummary from './PeriodSummary.js';
import SelectableList from './SelectableList.js';
import {
  formatTime,
  formatCurrency,
  formatEstimation,
  formatLiveDuration,
  sumEntryDurations,
  calculateDuration,
  formatRelativeTime,
  formatHour,
} from '../utils.js';
import {format} from 'date-fns';
import {calculateEstimatedPrice} from '../services/pricingService.js';
import {
  VIEW_RANGE_OPTIONS,
  formatViewPeriod,
  getViewDateRange,
  moveViewLevel,
  moveViewPeriod,
  moveViewRangeIndex,
} from './viewRange.js';

const View = ({height}) => {
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

  const selectedRange = VIEW_RANGE_OPTIONS[selectedRangeIndex];
  const currentRange = getViewDateRange(selectedRange.type, rangeAnchor);
  const periodLabel = formatViewPeriod(selectedRange.type, rangeAnchor);
  const {metrics: clientMetrics, loading: clientMetricsLoading} =
    useLiveClientMetrics({
      clientId: selectedClientId,
      rangeType: selectedRange.type,
      startDate: currentRange.startDate,
      endDate: currentRange.endDate,
      reload,
    });
  const currentClientMetrics =
    clientMetrics?.clientId === selectedClientId &&
    clientMetrics?.rangeType === selectedRange.type &&
    clientMetrics?.startDate === currentRange.startDate &&
    clientMetrics?.endDate === currentRange.endDate
      ? clientMetrics
      : null;
  const {summary: periodSummary, loading: periodSummaryLoading} =
    usePeriodSummary({
      rangeType: selectedRange.type,
      startDate: currentRange.startDate,
      endDate: currentRange.endDate,
      reload,
    });

  useEffect(() => {
    if (isClientFocused) setLastSection('client');
    else if (isProjectsFocused) setLastSection('project');
    else if (isTasksFocused) setLastSection('task');
  }, [isClientFocused, isProjectsFocused, isTasksFocused]);

  const taskProject = allProjects.find(p => p.id === taskDetails?.project_id);
  const taskClient = clients.find(c => c.id === taskProject?.client_id);
  const hasActiveTimeEntry = timeEntries.some(entry => !entry.end);
  const taskNow = useLiveNow(hasActiveTimeEntry);

  const {
    selectedIndex: selectedEntryIndex,
    selectNext: selectNextEntry,
    selectPrevious: selectPreviousEntry,
  } = useScrollableList(timeEntries, {wrap: true});
  const {analytics, loading: analyticsLoading} = useTaskAnalytics(
    selectedTaskId,
    currentRange.startDate,
    currentRange.endDate,
  );
  const {pricing: taskPricing, loading: taskPricingLoading} = usePricing(
    selectedTaskId,
    null,
    null,
    currentRange.startDate,
    currentRange.endDate,
    reload,
  );
  const {pricing: totalPricing, loading: totalPricingLoading} =
    useTotalEarnings(
      currentRange.startDate,
      currentRange.endDate,
      reload,
      taskClient,
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
        const project = allProjects.find(p => p.id === task?.project_id);
        const clientId = project?.client_id || null;
        const entries = await timeEntryModel.selectByDateRangeWithTask({
          startDate: currentRange.startDate,
          endDate: currentRange.endDate,
          clientId,
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
    if (timeEntries.length === 0) return;
    const entryToDelete = timeEntries[selectedEntryIndex];
    await timeEntryModel.delete(entryToDelete.id);
    setTimeEntries(prev => prev.filter(e => e.id !== entryToDelete.id));
    triggerReload();
  };

  const {openEditor} = useEditorBuffer(triggerReload);

  const startEntryAdjustment = () => {
    if (timeEntries.length === 0) return;

    const entryToAdjust = timeEntries[selectedEntryIndex];
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
    if (timeEntries.length === 0) return;
    openEditor(timeEntries, taskDetails?.title || 'All Entries');
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

  const renderTaskDetails = () => {
    if (!taskDetails) return <Text dimColor>Loading task details...</Text>;

    const project = taskProject;
    const client = taskClient;

    const selectedTaskEntries = timeEntries.filter(
      e => e.task_id === selectedTaskId,
    );
    const completedSeconds = sumEntryDurations(selectedTaskEntries);
    const activeSeconds = selectedTaskEntries.reduce(
      (total, entry) =>
        entry.start && !entry.end
          ? total + Math.max(0, calculateDuration(entry.start, taskNow))
          : total,
      0,
    );
    const totalSeconds = completedSeconds + activeSeconds;
    const activeEntries = selectedTaskEntries.filter(e => !e.end).length;
    const estimatedSec = taskDetails.estimated_minutes
      ? taskDetails.estimated_minutes * 60
      : null;
    const isOvertime = estimatedSec && totalSeconds > estimatedSec;
    const estimatedPrice = calculateEstimatedPrice(
      taskDetails.estimated_minutes,
      taskPricing?.hourlyRate,
    );
    const renderPrice = price => {
      if (taskPricingLoading && !taskPricing)
        return <Text dimColor>Loading...</Text>;
      return price === null || price === undefined ? (
        <Text dimColor>None</Text>
      ) : (
        formatCurrency(price, taskPricing.currency)
      );
    };
    const selectedEntry = timeEntries[selectedEntryIndex];
    const entryBeingChecked = draftEntry || selectedEntry;
    const entryOverlaps = entryBeingChecked?.end
      ? findTimeEntryOverlaps(entryBeingChecked, timeEntries)
      : [];
    const shouldShowOverlapInfo = draftEntry || entryOverlaps.length > 0;

    return (
      <Box flexDirection="column">
        <Box flexDirection="row" marginBottom={1}>
          <Box width={30}>
            <KeyValue
              label="Task Details:"
              items={[
                {key: 'Title', value: taskDetails.title},
                {key: 'Project', value: project?.name || 'Unknown'},
                {key: 'Client', value: client?.name || 'Unknown'},
                {
                  key: 'Status',
                  value:
                    activeEntries > 0 ? (
                      <Text color="green">Active</Text>
                    ) : (
                      'Stopped'
                    ),
                },
                {
                  key: 'Estimation',
                  value: formatEstimation(taskDetails.estimated_minutes) || (
                    <Text dimColor>None</Text>
                  ),
                },
                {
                  key: 'Total',
                  value: (
                    <Text color={isOvertime ? 'red' : undefined}>
                      {formatLiveDuration(totalSeconds, activeSeconds)}
                    </Text>
                  ),
                },
                {
                  key: 'Estimated Price',
                  value: renderPrice(estimatedPrice),
                },
                {
                  key: 'Current Price',
                  value: renderPrice(taskPricing?.earnings),
                },
              ]}
            />
          </Box>

          <Box width={35} marginLeft={2}>
            {analyticsLoading ? (
              <Text dimColor>Loading...</Text>
            ) : analytics ? (
              <KeyValue
                label={`Analytics (${analytics.meta.dateRangeDays}d):`}
                items={[
                  {key: 'Sessions', value: analytics.distribution.sessionCount},
                  {
                    key: 'Days',
                    value: `${analytics.distribution.daysWorked}/${analytics.distribution.dateRangeDays}`,
                  },
                  ...(analytics.distribution.peakHour !== null
                    ? [
                        {
                          key: 'Peak',
                          value: formatHour(analytics.distribution.peakHour),
                        },
                      ]
                    : []),
                  ...(analytics.distribution.deepWorkCount > 0
                    ? [
                        {
                          key: 'Deep Work',
                          value: (
                            <Text color="green">
                              {analytics.distribution.deepWorkCount}
                            </Text>
                          ),
                        },
                      ]
                    : []),
                  ...(analytics.distribution.lastActivityDate
                    ? [
                        {
                          key: 'Last',
                          value: formatRelativeTime(
                            analytics.distribution.lastActivityDate,
                          ),
                        },
                      ]
                    : []),
                ]}
              />
            ) : null}
          </Box>

          <Box width={25} marginLeft={2}>
            <Earnings pricing={totalPricing} loading={totalPricingLoading} />
          </Box>
        </Box>

        <Text color="cyan" bold>
          Time Entries ({timeEntries.length}):
        </Text>
        {timeEntries.length === 0 ? (
          <Text dimColor marginLeft={2}>
            No time entries
          </Text>
        ) : (
          <Box flexDirection="column" marginTop={1}>
            <Box gap={1}>
              <Box width={2} />
              <Box width={16}>
                <Text bold dimColor>
                  Task
                </Text>
              </Box>
              <Box width={19}>
                <Text bold dimColor>
                  Start
                </Text>
              </Box>
              <Box width={19}>
                <Text bold dimColor>
                  End
                </Text>
              </Box>
              <Box width={20}>
                <Text bold dimColor>
                  Duration
                </Text>
              </Box>
              <Text bold dimColor>
                Overlap
              </Text>
            </Box>

            <ScrollBox
              height={Math.max(5, height - 30)}
              selectedIndex={selectedEntryIndex}
            >
              {timeEntries.map((entry, index) => {
                const isCursor = index === selectedEntryIndex && isViewFocused;
                const isSelectedTask = entry.task_id === selectedTaskId;
                const isDraftRow = draftEntry?.id === entry.id;
                const displayEntry = isDraftRow ? draftEntry : entry;
                const color = isDraftRow
                  ? 'yellow'
                  : isCursor
                    ? 'green'
                    : isSelectedTask
                      ? '#E8A030'
                      : 'white';
                const duration = calculateDuration(
                  displayEntry.start,
                  displayEntry.end || taskNow,
                );
                const rowOverlaps = displayEntry.end
                  ? findTimeEntryOverlaps(displayEntry, timeEntries)
                  : [];
                const overlapSummary = formatTimeEntryOverlapSummary(
                  rowOverlaps,
                  displayEntry,
                );
                const taskName = (entry.title || '').slice(0, 16);

                return (
                  <Box key={entry.id} gap={1}>
                    <Text color={color}>{isCursor ? '• ' : '  '}</Text>
                    <Box width={16}>
                      <Text color={color}>{taskName}</Text>
                    </Box>
                    <Box width={19}>
                      <Text color={color}>
                        {format(displayEntry.start, 'yyyy-MM-dd HH:mm:ss')}
                      </Text>
                    </Box>
                    <Box width={19}>
                      <Text color={color}>
                        {displayEntry.end ? (
                          format(displayEntry.end, 'yyyy-MM-dd HH:mm:ss')
                        ) : (
                          <Text color="yellow">Running...</Text>
                        )}
                      </Text>
                    </Box>
                    <Box width={20}>
                      <Text color={color}>
                        {duration > 0 ? formatTime(duration) : '-'}
                        {isDraftRow ? ' [draft]' : ''}
                      </Text>
                    </Box>
                    <Text color={rowOverlaps.length > 0 ? 'red' : color}>
                      {overlapSummary ? overlapSummary.slice(0, 40) : '-'}
                    </Text>
                  </Box>
                );
              })}
            </ScrollBox>

            {shouldShowOverlapInfo && (
              <Box flexDirection="column" marginTop={1}>
                <Text color={entryOverlaps.length > 0 ? 'red' : 'green'}>
                  {entryOverlaps.length > 0
                    ? `${draftEntry ? '⚠ Draft overlaps' : '⚠ Selected entry overlaps'} ${entryOverlaps.length} entr${entryOverlaps.length === 1 ? 'y' : 'ies'}`
                    : '✓ No overlaps'}
                </Text>
                {entryOverlaps.slice(0, 3).map(overlap => (
                  <Text key={overlap.entry.id} color="red">
                    {`  - ${(overlap.entry.title || 'Entry').slice(0, 16)} ${format(overlap.entry.start, 'HH:mm')}-${format(overlap.entry.end, 'HH:mm')} by ${formatTime(overlap.overlapSeconds)}`}
                  </Text>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>
    );
  };

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
          <Box width={30} marginLeft={2}>
            <Earnings
              pricing={currentClientMetrics}
              loading={clientMetricsLoading && !currentClientMetrics}
            />
          </Box>
          <Box width={30} marginLeft={2}>
            <WorkTargets
              breakdown={currentClientMetrics}
              loading={clientMetricsLoading && !currentClientMetrics}
              rangeLabel={selectedRange.label}
            />
          </Box>
        </Box>
      </Box>
    );
  };

  const renderDashboard = () => (
    <PeriodSummary
      summary={periodSummary}
      loading={periodSummaryLoading}
      rangeLabel={selectedRange.label}
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

  const hasTimeEntries = timeEntries.length > 0;

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
            controls="h/l to choose, Enter to confirm"
            isFocused={isViewFocused && viewLevel === 'range'}
          />
          <PeriodNavigator
            rangeLabel={selectedRange.label}
            periodLabel={periodLabel}
            controls="h/l to navigate, t for current, Enter to open, Esc to go back"
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
