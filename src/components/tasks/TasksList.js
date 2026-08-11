import React from 'react';
import ScrollBox from '../ScrollBox.js';
import NameAndDetails from './NameAndDetails.js';
import {getVisibleTaskCount} from './taskListLayout.js';

const TasksList = ({panelHeight, projectTasks, selectedTaskId}) => {
  const selectedIndex = projectTasks.findIndex(t => t.id === selectedTaskId);

  return (
    <ScrollBox
      height={getVisibleTaskCount(panelHeight)}
      selectedIndex={selectedIndex}
      itemCount={projectTasks.length}
    >
      {projectTasks.map(task => (
        <NameAndDetails
          key={task.id}
          task={task}
          isSelected={task.id === selectedTaskId}
        />
      ))}
    </ScrollBox>
  );
};

export default TasksList;
