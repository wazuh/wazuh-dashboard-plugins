/*
 * Wazuh app - React component which renders a field search bar
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useState, useEffect, useRef } from 'react';
import { 
  EuiFieldSearch
} from '@elastic/eui';

interface IWzFieldSearchBarProps{
  onSearch: (searchTerm: string) => any
  onChange?: (searchTerm: string) => any
  searchDelay?: number
  [key: string]: any
}

export const WzFieldSearch = ({searchDelay, onSearch, onChange, ...rest}: IWzFieldSearchBarProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const timerRef = useRef();
  const onChangeSearchTerm = e => setSearchTerm(e.target.value);

  useEffect(() => {
    onChange && onChange(searchTerm);
    if(searchDelay){
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => onSearch(searchTerm), searchDelay);
    }
    return () => clearTimeout(timerRef.current);
  }, [searchTerm])

  return <EuiFieldSearch
    value={searchTerm}
    onChange={onChangeSearchTerm}
    onSearch={() => onSearch(searchTerm)}
    {...rest}
  />
}