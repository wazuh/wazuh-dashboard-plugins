/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useEffect, useState } from 'react';
import { EuiSuggest } from '../eui-suggest';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { qSuggests } from './lib/q-handler';
import { apiSuggests } from './lib/api-handler';
import { WzSearchButtons, filterButton } from './wz-search-buttons';
import { WzSearchBadges } from './components';
import { SuggestHandler } from './lib';
import { IFilter } from './';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';

export interface suggestItem {
  type: { iconType: string; color: string };
  label: string;
  description?: string;
}

export interface IWzSuggestItem extends apiSuggests, qSuggests {
  type: 'q' | 'params';
}

export interface IWzSearchBarProps {
  suggestions: IWzSuggestItem[];
  buttonOptions?: filterButton[];
  searchDisable?: boolean;
  noDeleteFiltersOnUpdateSuggests?: boolean;
  placeholder?: string;
  filters: IFilter[];
  onFiltersChange(filters: {}[]): void;
}

export function WzSearchBar(props: IWzSearchBarProps) {
  const [inputRef, setInputRef] = useState();
  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestsItems, handler, status, isInvalid] = useSuggestHandler(
    props,
    inputValue,
    setInputValue,
    inputRef,
    setIsOpen
  );
  return (
    <EuiFlexGroup>
      <EuiFlexItem>
        <EuiSuggest
          status={status}
          inputRef={setInputRef}
          prepend={
            <WzSearchBadges filters={props.filters} onFiltersChange={props.onFiltersChange} />
          }
          value={inputValue}
          onKeyPress={(event) => handler && handler.onKeyPress(inputValue, event)}
          onItemClick={(item) => handler && handler.onItemClick(item, inputValue)}
          isPopoverOpen={isOpen}
          onClosePopover={() => setIsOpen(false)}
          onPopoverFocus={() => setIsOpen(true)}
          suggestions={suggestsItems}
          onInputChange={setInputValue}
          isInvalid={isInvalid}
          placeholder={props.placeholder}
        />
      </EuiFlexItem>
      {!!props.buttonOptions && (
        <EuiFlexItem grow={false}>
          <WzSearchButtons
            filters={props.filters}
            options={props.buttonOptions}
            onChange={(filters) => props.onFiltersChange(filters)}
          />
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
}

function useSuggestHandler(
  props: IWzSearchBarProps,
  inputValue,
  setInputValue,
  inputRef,
  setIsOpen
): [suggestItem[], SuggestHandler | undefined, string, boolean] {
  const [handler, setHandler] = useState<undefined | SuggestHandler>();
  const [suggestsItems, setSuggestItems] = useState<suggestItem[]>([]);
  const [status, setStatus] = useState<'unchanged' | 'loading'>('unchanged');
  const [isInvalid, setInvalid] = useState(false);

  useEffect(() => {
    setHandler(
      new SuggestHandler({ ...props, status, setStatus, setInvalid, setIsOpen }, setInputValue, inputRef)
    );
    !props.noDeleteFiltersOnUpdateSuggests && props.onFiltersChange([]);
  }, [props.suggestions]);

  useEffect(() => {
    handler && (handler.inputRef = inputRef);
  }, [inputRef]);

  useEffect(() => {
    if (handler) {
      (async () => {
        try {
          setSuggestItems(await handler.buildSuggestItems(inputValue));
        } catch (error) {
          if (error !== 'New request in progress') {
            const options = {
              context: `${useSuggestHandler.name}.useEffect`,
              level: UI_LOGGER_LEVELS.ERROR,
              severity: UI_ERROR_SEVERITIES.CRITICAL,
              store: true,
              error: {
                error: error,
                message: error.message || error,
                title: error.name || error,
              },
            };
            getErrorOrchestrator().handleError(options);
          }
        }
      })();
    }
  }, [inputValue, handler]);

  useEffect(() => {
    handler && (handler.filters = props.filters);
  }, [props.filters]);

  return [suggestsItems, handler, status, isInvalid];
}
