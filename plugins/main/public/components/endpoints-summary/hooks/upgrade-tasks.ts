import { useState, useEffect } from 'react';
import { getTasks } from '../services';
import { API_NAME_TASK_STATUS } from '../../../../common/constants';

const beforeMinutes = 60;

export const useGetUpgradeTasks = (reload: any) => {
  const [totalInProgressTasks, setTotalInProgressTasks] = useState<number>(0);
  const [getInProgressIsLoading, setGetInProgressIsLoading] = useState(true);
  const [getInProgressError, setGetInProgressError] = useState();

  const [totalSuccessTasks, setTotalSuccessTasks] = useState<number>(0);
  const [getSuccessIsLoading, setSuccessIsLoading] = useState(true);
  const [getSuccessError, setGetSuccessError] = useState();

  const [totalErrorUpgradeTasks, setTotalErrorUpgradeTasks] =
    useState<number>(0);
  const [getErrorIsLoading, setErrorIsLoading] = useState(true);
  const [getErrorTasksError, setGetErrorTasksError] = useState();

  const datetime = new Date();
  datetime.setMinutes(datetime.getMinutes() - beforeMinutes);
  const formattedDate = datetime.toISOString();
  const timeFilter = `last_update_time>${formattedDate}`;

  const getUpgradesInProgress = async () => {
    try {
      setGetInProgressIsLoading(true);
      const { total_affected_items } = await getTasks({
        status: API_NAME_TASK_STATUS.IN_PROGRESS,
        command: 'upgrade',
        limit: 1,
      });
      setTotalInProgressTasks(total_affected_items);
      setGetInProgressError(undefined);
    } catch (error: any) {
      console.log({ error });
      setGetInProgressError(error);
    } finally {
      setGetInProgressIsLoading(false);
    }
  };

  const getUpgradesSuccess = async () => {
    try {
      setSuccessIsLoading(true);
      const { total_affected_items } = await getTasks({
        status: API_NAME_TASK_STATUS.DONE,
        command: 'upgrade',
        limit: 1,
        q: timeFilter,
      });
      setTotalSuccessTasks(total_affected_items);
      setGetSuccessError(undefined);
    } catch (error: any) {
      setGetSuccessError(error);
    } finally {
      setSuccessIsLoading(false);
    }
  };

  const getUpgradesError = async () => {
    try {
      setErrorIsLoading(true);
      const { total_affected_items } = await getTasks({
        status: API_NAME_TASK_STATUS.FAILED,
        command: 'upgrade',
        limit: 1,
        q: timeFilter,
      });
      setTotalErrorUpgradeTasks(total_affected_items);
      setGetErrorTasksError(undefined);
    } catch (error: any) {
      setGetErrorTasksError(error);
    } finally {
      setErrorIsLoading(false);
    }
  };

  const fetchData = async () => {
    await getUpgradesInProgress();
    await getUpgradesSuccess();
    await getUpgradesError();
  };

  useEffect(() => {
    fetchData();

    const intervalId = setInterval(getUpgradesInProgress, 3000);

    if (totalInProgressTasks === 0) {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId);
  }, [totalInProgressTasks, reload]);

  return {
    getInProgressIsLoading,
    totalInProgressTasks,
    getInProgressError,
    getSuccessIsLoading,
    totalSuccessTasks,
    getSuccessError,
    getErrorIsLoading,
    totalErrorUpgradeTasks,
    getErrorTasksError,
  };
};
