import React from 'react';
import {Box} from 'ink';
import NameAndDetails from './NameAndDetails.js';
import ScrollBox from '../ScrollBox.js';
import {formatTime} from '../../utils.js';
import {getVisibleTaskCount} from '../../layout/sidebarLayout.js';

const TasksList = ({panelHeight, dateTasks, selectedTaskId, isT1}) => {
  const selectedIndex = dateTasks.findIndex(t => t.id === selectedTaskId);

  return (
    <ScrollBox
      height={getVisibleTaskCount(panelHeight)}
      selectedIndex={selectedIndex}
      itemCount={dateTasks.length}
    >
      {dateTasks.map(uniqueTask => (
        <NameAndDetails
          key={uniqueTask.id}
          uniqueTask={uniqueTask}
          isSelected={uniqueTask.id === selectedTaskId}
          timeDisplay={formatTime(
            isT1
              ? Math.floor(uniqueTask.totalSec + uniqueTask.totalSec * 0.33)
              : uniqueTask.totalSec,
          )}
        />
      ))}
    </ScrollBox>
  );
};

export default TasksList;
