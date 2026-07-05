import React, {useState, useEffect} from 'react';
import {Text} from 'ink';
import DelayedDisappear from './DelayedDisappear.js';
import Frame from './Frame.js';
import HelpBottom from './HelpBottom.js';
import TasksContent from './tasks/TasksContent.js';
import TodayHours from './TodayHours.js';
import taskService from '../services/taskService.js';
import projectService from '../services/projectService.js';
import pomodoroService from '../services/pomodoroService.js';
import useDateTasks from '../hooks/useDateTasks.js';
import usePomodoroStatus from '../hooks/usePomodoroStatus.js';
import {BORDER_COLOR_DEFAULT, BORDER_COLOR_FOCUSED, TASKS} from '../consts.js';
import {getDayOfWeek, retriveYYYYMMDD} from '../utils.js';
import {useComponentKeys} from '../hooks/useComponentKeys.js';
import {useNavigation} from '../contexts/NavigationContext.js';
import {useData} from '../contexts/DataContext.js';
import createTogglSync from '../toggl-sync/index.js';
import syncedDay from '../models/syncedDay.js';

const formatPomodoroStatus = status => {
  if (!status) return null;

  const phase = status.status === 'work' ? 'Work' : 'Break';
  const breakType = status.breakType === 'long' ? 'long' : 'short';
  const suffix = status.status === 'break' ? ` ${breakType}` : '';
  return `${phase}${suffix} #${status.sessionNumber}: ${status.remainingText}`;
};

const Tasks = ({height}) => {
  const {isTasksFocused, getBorderTitle, mode} = useNavigation();
  const {
    selectedProjectId,
    selectedClientId,
    selectedTaskId,
    setSelectedTaskId,
    triggerReload,
    reload,
  } = useData();

  const [selectedProject, setSelectedProject] = useState(null);
  const [message, setMessage] = useState('');
  const [isT1, setIsT1] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingEstimation, setIsEditingEstimation] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [isSelectingCategory, setIsSelectingCategory] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDate, setSelectedDate] = useState(retriveYYYYMMDD());
  const [isSynced, setIsSynced] = useState(false);

  const dateTasks = useDateTasks(selectedDate);
  const pomodoroStatus = usePomodoroStatus();
  const selectedTask = dateTasks.find(t => t.id === selectedTaskId);

  useEffect(() => {
    const loadProject = async () => {
      if (!selectedProjectId) {
        setSelectedProject(null);
        return;
      }
      const projectData =
        await projectService.getProjectById(selectedProjectId);
      setSelectedProject(projectData);
    };
    loadProject();
  }, [selectedProjectId, reload]);

  useEffect(() => {
    if (dateTasks.length > 0 && !selectedTaskId)
      setSelectedTaskId(dateTasks[0]?.id);
  }, [selectedProjectId, dateTasks]);

  useEffect(() => {
    const checkSyncStatus = async () => {
      const synced = await syncedDay.isSynced(selectedDate, selectedClientId);
      setIsSynced(synced);
    };
    checkSyncStatus();
  }, [selectedDate, selectedClientId]);

  useEffect(() => pomodoroService.subscribe(triggerReload), [triggerReload]);

  const borderColor = isTasksFocused
    ? BORDER_COLOR_FOCUSED
    : BORDER_COLOR_DEFAULT;
  const baseTitle = getBorderTitle(TASKS);
  const dateDisplay =
    (selectedDate === retriveYYYYMMDD() ? 'today' : selectedDate) +
    ' - ' +
    getDayOfWeek(new Date(selectedDate));

  const selectNextUniqueTask = () => {
    if (dateTasks.length === 0) return;
    const currentIndex = dateTasks.findIndex(
      task => task.id === selectedTaskId,
    );
    const nextIndex =
      currentIndex < dateTasks.length - 1 ? currentIndex + 1 : 0;
    setSelectedTaskId(dateTasks[nextIndex].id);
  };

  const selectPreviousUniqueTask = () => {
    if (dateTasks.length === 0) return;
    const currentIndex = dateTasks.findIndex(
      task => task.id === selectedTaskId,
    );
    const prevIndex =
      currentIndex > 0 ? currentIndex - 1 : dateTasks.length - 1;
    setSelectedTaskId(dateTasks[prevIndex].id);
  };

  const handleNewTask = () => {
    if (!selectedProjectId) {
      setMessage('Select a project first');
      return;
    }
    setIsCreating(true);
    setMessage('');
  };

  const handleSearchTask = () => {
    if (!selectedProjectId) {
      setMessage('Select a project first');
      return;
    }
    setIsSearching(true);
    setMessage('');
  };

  const handleSearchSubmit = async title => {
    if (!title.trim()) return;
    try {
      await pomodoroService.stopActivePomodoro();
      const result = await taskService.toggleTask({
        title: title.trim(),
        projectId: selectedProjectId,
      });
      setIsSearching(false);
      setSelectedTaskId(result.taskId);
      setMessage(`Started task: ${title}`);
      triggerReload();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleSearchCancel = () => {
    setIsSearching(false);
    setMessage('');
  };

  const handleEditTask = () => {
    if (!selectedTaskId) {
      setMessage('No task selected');
      return;
    }
    setIsEditing(true);
    setMessage('');
  };

  const handleDeleteTask = () => {
    if (!selectedTaskId || !selectedTask) {
      setMessage('No task selected');
      return;
    }
    setIsDeleting(true);
    setMessage('');
  };

  const handleDeleteConfirm = async confirmation => {
    if (
      confirmation.toLowerCase() === 'y' ||
      confirmation.toLowerCase() === 'yes'
    ) {
      try {
        await taskService.deleteByTitleAndDate(
          selectedTask.title,
          selectedProjectId,
          selectedDate,
        );
        triggerReload();
        setMessage(
          `Deleted ${selectedTask.title} entries from ${selectedDate === retriveYYYYMMDD() ? 'today' : selectedDate}`,
        );
      } catch (error) {
        setMessage(`Error deleting task: ${error.message}`);
      }
    } else {
      setMessage('Delete cancelled');
    }
    setIsDeleting(false);
  };

  const handleDeleteCancel = () => {
    setIsDeleting(false);
    setMessage('Delete cancelled');
  };

  const handleCreateSubmit = async title => {
    if (!title.trim()) return;
    try {
      await pomodoroService.stopActivePomodoro();
      const result = await taskService.toggleTask({
        title: title.trim(),
        projectId: selectedProjectId,
      });
      setIsCreating(false);
      setSelectedTaskId(result.taskId);
      setMessage(`Created task: ${title}`);
      triggerReload();
    } catch (error) {
      setMessage(`Error creating task: ${error.message}`);
    }
  };

  const handleCreateCancel = () => {
    setIsCreating(false);
    setMessage('');
  };

  const handleEditSubmit = async title => {
    if (!title.trim()) return;
    try {
      await taskService.update(selectedTaskId, title.trim(), selectedProjectId);
      setIsEditing(false);
      setMessage(`Updated task: ${title}`);
      triggerReload();
    } catch (error) {
      setMessage(`Error updating task: ${error.message}`);
    }
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setMessage('');
  };

  const handleEditEstimation = () => {
    if (!selectedTaskId) {
      setMessage('No task selected');
      return;
    }
    setIsEditingEstimation(true);
    setMessage('');
  };

  const handleEstimationSubmit = async minutes => {
    try {
      await taskService.updateEstimation(selectedTaskId, minutes);
      setIsEditingEstimation(false);
      const h = minutes ? Math.floor(minutes / 60) : 0;
      const m = minutes ? minutes % 60 : 0;
      const display = h > 0 ? `${h}h ${m}m` : `${m}m`;
      setMessage(
        minutes ? `Estimation set to ${display}` : 'Estimation cleared',
      );
      triggerReload();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleEstimationCancel = () => {
    setIsEditingEstimation(false);
    setMessage('');
  };

  const handleEditMetadata = () => {
    if (!selectedTaskId) {
      setMessage('No task selected');
      return;
    }
    setIsEditingMetadata(true);
    setMessage('');
  };

  const handleMetadataSubmit = async metadata => {
    try {
      await taskService.updateMetadata(selectedTaskId, metadata);
      setIsEditingMetadata(false);
      setMessage('Metadata updated');
      triggerReload();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleMetadataCancel = () => {
    setIsEditingMetadata(false);
    setMessage('');
  };

  const handleToggleExploration = async () => {
    if (!selectedTaskId) {
      setMessage('No task selected');
      return;
    }
    try {
      const newValue = await taskService.toggleExploration(selectedTaskId);
      setMessage(
        newValue ? 'Marked as exploration' : 'Unmarked as exploration',
      );
      triggerReload();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleQuickCategory = () => {
    if (!selectedTaskId) {
      setMessage('No task selected');
      return;
    }
    setIsSelectingCategory(true);
    setMessage('');
  };

  const handleCategorySelect = async category => {
    try {
      await taskService.updateMetadata(selectedTaskId, {category});
      setIsSelectingCategory(false);
      setMessage(`Category set to ${category}`);
      triggerReload();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleCategoryCancel = () => {
    setIsSelectingCategory(false);
    setMessage('');
  };

  const handleStartStopTask = async () => {
    if (!selectedTaskId) {
      setMessage('No task selected');
      return;
    }
    try {
      await pomodoroService.stopActivePomodoro();
      await taskService.toggleTaskById({taskId: selectedTaskId});
      triggerReload();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handlePomodoroStartStop = async () => {
    if (!selectedTaskId) {
      setMessage('No task selected');
      return;
    }
    if (selectedDate !== retriveYYYYMMDD()) {
      setMessage('Pomodoro can only start for today');
      return;
    }

    try {
      const result = await pomodoroService.togglePomodoro(selectedTaskId);
      setMessage(
        result.action === 'stopped'
          ? 'Pomodoro stopped'
          : `Pomodoro ${result.action}`,
      );
      triggerReload();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handlePreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    setSelectedDate(retriveYYYYMMDD(currentDate));
  };

  const handleNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    setSelectedDate(retriveYYYYMMDD(currentDate));
  };

  const handleSetIsT1 = () => setIsT1(!isT1);

  const handleTogglSync = async () => {
    if (isSynced) {
      setMessage('Day already synced');
      return;
    }
    try {
      setMessage('Syncing with Toggl...');
      const togglSync = createTogglSync(
        process.env.TOGGL_API_TOKEN,
        process.env.TOGGL_WORKSPACE_ID,
      );
      const dateToSync = new Date(selectedDate);
      const results = await togglSync.syncTasksByDate(
        dateToSync,
        null,
        selectedClientId,
      );
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      if (failed === 0) {
        await syncedDay.markAsSynced(selectedDate, selectedClientId);
        setIsSynced(true);
        setMessage(`Synced ${successful} tasks successfully`);
        triggerReload();
      } else {
        setMessage(`Synced ${successful} tasks, ${failed} failed`);
      }
    } catch (error) {
      setMessage(`Sync error: ${error.message}`);
    }
  };

  const keyMappings = [
    {key: 'c', action: handleNewTask},
    {key: 'i', action: handleEditTask},
    {key: 'E', action: handleEditEstimation},
    {key: 'M', action: handleEditMetadata},
    {key: 'C', action: handleQuickCategory},
    {key: 'X', action: handleToggleExploration},
    {key: 'd', action: handleDeleteTask},
    {key: 'j', action: selectNextUniqueTask},
    {key: 'k', action: selectPreviousUniqueTask},
    {key: 's', action: handleStartStopTask},
    {key: 'P', action: handlePomodoroStartStop},
    {key: 'p', action: handlePreviousDay},
    {key: 'n', action: handleNextDay},
    {key: 'x', action: handleSetIsT1},
    {key: 't', action: handleTogglSync},
    {key: '/', action: handleSearchTask},
  ];

  useComponentKeys(TASKS, keyMappings, isTasksFocused);

  const isInEditMode =
    isCreating ||
    isEditing ||
    isEditingEstimation ||
    isEditingMetadata ||
    isSelectingCategory ||
    isDeleting ||
    isSearching;
  const taskCount = dateTasks.length;

  return (
    <Frame borderColor={borderColor} height={height}>
      <Frame.Header>
        <Text color={borderColor} bold>
          {baseTitle}
          {taskCount > 0 && <Text dimColor> ({taskCount})</Text>} -{' '}
          <TodayHours selectedDate={selectedDate} isT1={isT1} /> - {dateDisplay}
          {pomodoroStatus && (
            <Text color="magenta">
              {' '}
              - {formatPomodoroStatus(pomodoroStatus)}
            </Text>
          )}
        </Text>
        <DelayedDisappear key={message}>
          <Text color="yellow">{message}</Text>
        </DelayedDisappear>
      </Frame.Header>
      <Frame.Body>
        <TasksContent
          isCreating={isCreating}
          isEditing={isEditing}
          isEditingEstimation={isEditingEstimation}
          isEditingMetadata={isEditingMetadata}
          isSelectingCategory={isSelectingCategory}
          isDeleting={isDeleting}
          isSearching={isSearching}
          dateTasks={dateTasks}
          selectedProject={selectedProject}
          selectedTaskId={selectedTaskId}
          selectedTaskTitle={selectedTask?.title}
          selectedTaskEstimationMinutes={selectedTask?.estimatedMinutes}
          selectedTaskMetadata={{
            epic: selectedTask?.epic,
            category: selectedTask?.category,
            isExploration: selectedTask?.isExploration,
            scope: selectedTask?.scope,
          }}
          dateDisplay={dateDisplay}
          isT1={isT1}
          handleCreateSubmit={handleCreateSubmit}
          handleCreateCancel={handleCreateCancel}
          handleEditSubmit={handleEditSubmit}
          handleEditCancel={handleEditCancel}
          handleEstimationSubmit={handleEstimationSubmit}
          handleEstimationCancel={handleEstimationCancel}
          handleMetadataSubmit={handleMetadataSubmit}
          handleMetadataCancel={handleMetadataCancel}
          handleCategorySelect={handleCategorySelect}
          handleCategoryCancel={handleCategoryCancel}
          handleDeleteConfirm={handleDeleteConfirm}
          handleDeleteCancel={handleDeleteCancel}
          handleSearchSubmit={handleSearchSubmit}
          handleSearchCancel={handleSearchCancel}
          selectedProjectId={selectedProjectId}
        />
      </Frame.Body>
      <Frame.Footer>
        {isTasksFocused && mode === 'normal' && !isInEditMode && (
          <HelpBottom>
            j/k:nav c:new /:search i:edit E:est M:meta C:cat d:del s:start
            P:pomodoro p/n:day
          </HelpBottom>
        )}
      </Frame.Footer>
    </Frame>
  );
};

export default Tasks;
