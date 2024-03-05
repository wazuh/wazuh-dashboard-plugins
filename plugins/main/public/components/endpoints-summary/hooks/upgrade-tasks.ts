import { useState, useEffect } from 'react';
import { getTasks } from '../services';
import { API_NAME_TASK_STATUS } from '../../../../common/constants';

export const useGetUpgradeTasks = reload => {
  const [totalInProgressTasks, setTotalInProgressTasks] = useState<number>();
  const [getInProgressIsLoading, setGetInProgressIsLoading] = useState(true);
  const [getInProgressError, setGetInProgressError] = useState();

  const [totalErrorUpgradeTasks, setTotalErrorUpgradeTasks] =
    useState<number>();
  const [getErrorIsLoading, setErrorIsLoading] = useState(true);
  const [getErrorTasksError, setGetErrorTasksError] = useState();

  const getUpgradesInProgress = async () => {
    try {
      setGetInProgressIsLoading(true);
      const { total_affected_items } = await getTasks({
        status: 'In progress',
        command: 'upgrade',
        limit: 1,
      });
      setTotalInProgressTasks(total_affected_items);
      setGetInProgressError(undefined);
    } catch (error: any) {
      setGetInProgressError(error);
    } finally {
      setGetInProgressIsLoading(false);
    }
  };

  const getUpgradesError = async () => {
    try {
      setErrorIsLoading(true);
      const datetime = new Date();
      datetime.setMinutes(datetime.getMinutes() - 60);
      const formattedDate = datetime.toISOString();

      const { total_affected_items } = await getTasks({
        status: API_NAME_TASK_STATUS.FAILED,
        command: 'upgrade',
        limit: 1,
        q: `last_update_time>${formattedDate}`,
      });
      setTotalErrorUpgradeTasks(total_affected_items);
      setGetErrorTasksError(undefined);
    } catch (error: any) {
      setGetErrorTasksError(error);
    } finally {
      setErrorIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await getUpgradesInProgress();
      await getUpgradesError();

      if (totalInProgressTasks === 0) {
        clearInterval(intervalId);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 3000);

    return () => clearInterval(intervalId);
  }, [totalInProgressTasks, reload]);

  return {
    getInProgressIsLoading,
    totalInProgressTasks,
    getInProgressError,
    totalErrorUpgradeTasks: 5,
    getErrorIsLoading,
    getErrorTasksError,
  };
};
