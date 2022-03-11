import { useCallback, useState, useEffect } from 'react';

export function useAsyncActionRunOnStart(action, dependencies = []){
  const [running, setRunning] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const run = useCallback(async () => {
    try{
      setRunning(true);
      setError(null);
      setData(null);
      const data = await action(...dependencies);
      setData(data);
    }catch(error){
      setError(error);
    }finally{
      setRunning(false);
    };
  }, [action,...dependencies]);

  useEffect(() => {
    run();
  }, [action,...dependencies]);


  return { data, error, running, run };
}