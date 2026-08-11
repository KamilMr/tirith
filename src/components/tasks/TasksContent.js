import React from 'react';
import TaskCreatingForm from './TaskCreatingForm.js';
import TaskEditingForm from './TaskEditingForm.js';
import EstimationEditingForm from './EstimationEditingForm.js';
import MetadataEditingForm from './MetadataEditingForm.js';
import CategoryQuickSelect from './CategoryQuickSelect.js';
import ManualTimeEntryForm from './ManualTimeEntryForm.js';
import NoProjectSelected from './NoProjectSelected.js';
import NoTasksFound from './NoTasksFound.js';
import TasksList from './TasksList.js';
import AutocompleteTextInput from '../AutocompleteTextInput.js';
import {formatEstimation} from '../../utils.js';

const TasksContent = ({
  panelHeight,
  isCreating,
  isEditing,
  isEditingEstimation,
  isEditingMetadata,
  isSelectingCategory,
  isAddingManualTime,
  isSearching,
  projectTasks,
  selectedProject,
  selectedTaskId,
  selectedTaskTitle,
  selectedTaskEstimationMinutes,
  selectedTaskMetadata,
  handleCreateSubmit,
  handleCreateCancel,
  handleEditSubmit,
  handleEditCancel,
  handleEstimationSubmit,
  handleEstimationCancel,
  handleMetadataSubmit,
  handleMetadataCancel,
  handleCategorySelect,
  handleCategoryCancel,
  handleManualTimeSubmit,
  handleManualTimeCancel,
  handleSearchSubmit,
  handleSearchCancel,
  selectedProjectId,
}) => {
  if (isSearching) {
    return (
      <AutocompleteTextInput
        label="Search task"
        projectId={selectedProjectId}
        onSubmit={handleSearchSubmit}
        onCancel={handleSearchCancel}
      />
    );
  }

  if (isCreating) {
    return (
      <TaskCreatingForm
        onSubmit={handleCreateSubmit}
        onCancel={handleCreateCancel}
      />
    );
  }

  if (isEditing) {
    return (
      <TaskEditingForm
        defaultValue={selectedTaskTitle}
        onSubmit={handleEditSubmit}
        onCancel={handleEditCancel}
      />
    );
  }

  if (isEditingEstimation) {
    return (
      <EstimationEditingForm
        defaultValue={formatEstimation(selectedTaskEstimationMinutes) || ''}
        taskTitle={selectedTaskTitle}
        onSubmit={handleEstimationSubmit}
        onCancel={handleEstimationCancel}
      />
    );
  }

  if (isEditingMetadata) {
    return (
      <MetadataEditingForm
        taskTitle={selectedTaskTitle}
        defaultValues={selectedTaskMetadata}
        onSubmit={handleMetadataSubmit}
        onCancel={handleMetadataCancel}
      />
    );
  }

  if (isSelectingCategory) {
    return (
      <CategoryQuickSelect
        currentCategory={selectedTaskMetadata?.category}
        onSelect={handleCategorySelect}
        onCancel={handleCategoryCancel}
      />
    );
  }

  if (isAddingManualTime) {
    return (
      <ManualTimeEntryForm
        taskTitle={selectedTaskTitle}
        projectId={selectedProjectId}
        onSubmit={handleManualTimeSubmit}
        onCancel={handleManualTimeCancel}
      />
    );
  }

  if (!selectedProject) return <NoProjectSelected />;

  if (projectTasks.length === 0)
    return <NoTasksFound projectName={selectedProject.name} />;

  return (
    <TasksList
      panelHeight={panelHeight}
      projectTasks={projectTasks}
      selectedTaskId={selectedTaskId}
    />
  );
};

export default TasksContent;
