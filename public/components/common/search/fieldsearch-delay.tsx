/*
 * Wazuh app - Wazuh field search component with a delay
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useEffect, useRef, useState } from 'react';
import { EuiFieldSearch } from '@elastic/eui';

type WzFieldSearchProps = {
  delay?: number
  onSearch: (searchTerm: string) => void
  onChange?: (searchTerm: string) => void
  onError?: (error: any) => void
  [name: string]: any
}

export const WzFieldSearchDelay = ({ delay = 400, onChange, onSearch, onError, ...rest } : WzFieldSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const timerDelay = useRef();
  
  useEffect(() => {
    return () => timerDelay.current && clearTimeout(timerDelay.current);
  },[]);

  const onChangeInput = e => {
    const searchValue: string = e.target.value;
    onChange && onChange(searchValue);
    if(timerDelay.current){
      clearTimeout(timerDelay.current);
    };
    
    setSearchTerm(searchValue);

    timerDelay.current = setTimeout(() => {
      onSearchInput(searchValue);
    }, delay);
  };

  const onSearchInput = async (searchValue) => {
    try{
      if(timerDelay.current){
        clearTimeout(timerDelay.current);
      };
      setLoading(true);
      await onSearch(searchValue);
    }catch(error){
      onError && onError(error);
    }
    setLoading(false);
  }

  return <EuiFieldSearch {...rest} value={searchTerm} isLoading={loading} onChange={onChangeInput} onSearch={onSearchInput}/>
}