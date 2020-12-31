/*
 * Wazuh app - React component building the configuration component.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useEffect, Fragment } from 'react';
import {categoriesNames} from '../../../../utils/config-equivalences';
import { AppNavigate } from '../../../../react-services/app-navigate';
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiToolTip,
  EuiButtonIcon,
  EuiText,
  EuiSearchBar,
} from '@elastic/eui';
import { EuiFormErrorText } from '@elastic/eui';
import { useLocation } from 'react-router-dom';

export const Header = ({query, setQuery}) => {
  return (
    <EuiFlexGroup gutterSize='none'>
      <EuiFlexItem>
        <EuiFlexGroup gutterSize='none' direction='column'>
          <Title />
          <SubTitle />
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem>
        <EuiFlexGroup gutterSize='none' direction='column'>
          <SearchBar query={query} setQuery={setQuery}/>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  )
}


const Title = () => {
  return (
    <EuiFlexItem>
      <EuiTitle>
        <h2>
          App current settings&nbsp;
            <EuiToolTip
            position="right"
            content="More about configuration file">
            <EuiButtonIcon
              iconType="questionInCircle"
              iconSize="l"
              aria-label="Help"
              target="_blank"
              href="https://documentation.wazuh.com/current/user-manual/kibana-app/reference/config-file.html"
            ></EuiButtonIcon>
          </EuiToolTip>
        </h2>
      </EuiTitle>
    </EuiFlexItem>
  )
}

const SubTitle = () => {
  return (
    <EuiFlexItem >
      <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
        Configuration file located at
        /usr/share/kibana/optimize/wazuh/config/wazuh.yml
          </EuiText>
    </EuiFlexItem>
  )
}

const SearchBar = ({query, setQuery}) => {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState();
  console.log(location)
  const getDefaultCategory = () => {

    const queryUrlParams = new URLSearchParams(location.search)
    const category = queryUrlParams.get('category')
    category && setQuery(`category:(${category})`)
  }

  useEffect(() => {
    const cats = categoriesNames.map(item => ({value: item}));
    setCategories(cats);
    getDefaultCategory()
  }, [])
  const onChange = (args) => {
    if(args.error){
      setError(args.error);
    } else {
      setError(undefined);
      setQuery(args);
    }
  }
  return (
    <Fragment>
      <EuiSearchBar
        filters={[{
          type:'field_value_selection',
          field:'category',
          name:'Categories',
          multiSelect:'or',
          options:categories,
        }]}
        query={query.query || query}
        onChange={onChange}
        />
      {!!error &&
        <EuiFormErrorText>{`${error.name}: ${error.message}`}</EuiFormErrorText >
      }
    </Fragment>
  )
}

