/*
 * Wazuh app - React component building the configuration component.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState, useEffect } from 'react';
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
import { PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_APP_CONFIGURATION } from '../../../../../common/constants';
import { getPluginDataPath } from '../../../../../common/plugin';
import { webDocumentationLink } from '../../../../../common/services/web_documentation';

export const Header = ({query, setQuery, searchBarFilters}) => {
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
          <SearchBar query={query} setQuery={setQuery} searchBarFilters={searchBarFilters}/>
        </EuiFlexGroup>
      </EuiFlexItem>
    </EuiFlexGroup>
  )
};

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
              href={webDocumentationLink(PLUGIN_PLATFORM_WAZUH_DOCUMENTATION_URL_PATH_APP_CONFIGURATION)}
            ></EuiButtonIcon>
          </EuiToolTip>
        </h2>
      </EuiTitle>
    </EuiFlexItem>
  )
};

const SubTitle = () => {
  return (
    <EuiFlexItem >
      <EuiText color="subdued" style={{ paddingBottom: '15px' }}>
        Configuration file located at {getPluginDataPath('config/wazuh.yml')}
      </EuiText>
    </EuiFlexItem>
  )
};

const SearchBar = ({query, setQuery, searchBarFilters}) => {
  const [error, setError] = useState();
  
  useEffect(() => {
    getDefaultCategory(setQuery)
  }, []);

  const onChange = (args) => {
    if(args.error){
      setError(args.error);
    } else {
      setError(undefined);
      setQuery(args);
    }
  };
  
  return (
    <>
      <EuiSearchBar
        filters={searchBarFilters}
        query={query.query || query}
        onChange={onChange}
        />
      {!!error &&
        <EuiFormErrorText>{`${error.name}: ${error.message}`}</EuiFormErrorText >
      }
    </>
  )
};

const getDefaultCategory = (setQuery) => {
  const category:string | undefined = AppNavigate.getUrlParameter('category')
  category && setQuery(`category:(${category})`)
};
