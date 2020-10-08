/*
 * Wazuh app - React hook hidde or show the Kibana loading indicator
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useEffect, useState } from 'react';
//@ts-ignore
import chrome  from 'ui/chrome';

export const useKbnLoadingIndicator = ():[boolean, React.Dispatch<React.SetStateAction<boolean>>, boolean] => {
  const [loading, setLoading] = useState(false);
  const [flag, setFlag] = useState(false);
  const [visible, setVisible] = useState(0);

  useEffect(() => {
    const subscription = chrome.loadingCount.subscribe(count => {setVisible(count); !count && setFlag(false)});
    return subscription;
  }, []);

  useEffect(() => {
    if (loading && visible <= 0) {
      chrome.loadingCount.increment();
      setFlag(true);
    }

    if (!loading && flag && visible > 0) {
      chrome.loadingCount.decrement();
    }
  }, [visible, loading]);
  return [loading, setLoading, visible > 0]
}