import {useEffect, useState} from 'react';
import taskService from '../services/taskService.js';
import {useData} from '../contexts/DataContext.js';

const useProjectTasks = () => {
  const {selectedProjectId, reload} = useData();
  const [projectTasks, setProjectTasks] = useState([]);

  useEffect(() => {
    const loadProjectTasks = async () => {
      if (!selectedProjectId) {
        setProjectTasks([]);
        return;
      }

      try {
        setProjectTasks(
          await taskService.selectProjectTaskList(selectedProjectId),
        );
      } catch (error) {
        console.error('Error loading project tasks:', error);
        setProjectTasks([]);
      }
    };

    loadProjectTasks();
  }, [selectedProjectId, reload]);

  return projectTasks;
};

export default useProjectTasks;
