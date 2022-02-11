/*
 * Wazuh app - React hook for build async action runners
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { useCallback, useState } from 'react';

export function useAsyncAction(action, dependencies = []){
  const [running, setRunning] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const run = useCallback(async (...params) => {
    try{
      setRunning(true);
      setError(null);
      setData(null);
      const data = await action(...params);
      setData(data);
    }catch(error){
      setError(error);
    }finally{
      setRunning(false);
    };
  }, dependencies);

  return { data, error, running, run };
}