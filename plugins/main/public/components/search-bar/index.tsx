import React, { useEffect, useRef, useState } from 'react';
import {
  EuiButtonEmpty,
  EuiFormRow,
  EuiLink,
  EuiPopover,
  EuiPopoverTitle,
  EuiSpacer,
  EuiSelect,
  EuiText,
  EuiFlexGroup,
  EuiFlexItem,
} from '@elastic/eui';
import { EuiSuggest } from '../eui-suggest';
import { searchBarQueryLanguages } from './query-language';
import _ from 'lodash';
import { ISearchBarModeWQL } from './query-language/wql';
import { SEARCH_BAR_DEBOUNCE_UPDATE_TIME } from '../../../common/constants';

export interface SearchBarProps {
  defaultMode?: string;
  modes: ISearchBarModeWQL[];
  onChange?: (params: any) => void;
  onSearch: (params: any) => void;
  buttonsRender?: () => React.ReactNode;
  input?: string;
}

export const SearchBar = ({
  defaultMode,
  modes,
  onChange,
  onSearch,
  ...rest
}: SearchBarProps) => {
  // Query language ID and configuration
  const [queryLanguage, setQueryLanguage] = useState<{
    id: string;
    configuration: any;
  }>({
    id: defaultMode || modes[0].id,
    configuration:
      searchBarQueryLanguages[
        defaultMode || modes[0].id
      ]?.getConfiguration?.() || {},
  });
  // Popover query language is open
  const [isOpenPopoverQueryLanguage, setIsOpenPopoverQueryLanguage] =
    useState<boolean>(false);
  // Input field
  const [input, setInput] = useState<string | undefined>(rest.input || '');
  // Query language output of run method
  const [queryLanguageOutputRun, setQueryLanguageOutputRun] = useState<any>({
    searchBarProps: { suggestions: [] },
    output: undefined,
  });
  // Cache the previous output
  const queryLanguageOutputRunPreviousOutput = useRef(
    queryLanguageOutputRun.output,
  );
  // Controls when the suggestion popover is open/close
  const [isOpenSuggestionPopover, setIsOpenSuggestionPopover] =
    useState<boolean>(false);
  // Reference to the input
  const inputRef = useRef();
  // Debounce update timer
  const debounceUpdateSearchBarTimer = useRef();

  // Handler when searching
  const _onSearch = (output: any) => {
    // TODO: fix when searching
    onSearch(output);
    setIsOpenSuggestionPopover(false);
  };

  // Handler on change the input field text
  const onChangeInput = (event: React.ChangeEvent<HTMLInputElement>) =>
    setInput(event.target.value);

  const onKeyPressHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      _onSearch(queryLanguageOutputRun.output);
    }
  };

  const selectedQueryLanguageParameters = modes.find(
    ({ id }) => id === queryLanguage.id,
  );

  useEffect(() => {
    let isMounted = true;
    // React to external changes and set the internal input text. Use the `transformInput` of
    // the query language in use
    rest.input &&
      searchBarQueryLanguages[queryLanguage.id]?.transformInput &&
      setInput(
        searchBarQueryLanguages[queryLanguage.id]?.transformInput?.(
          rest.input,
          {
            configuration: queryLanguage.configuration,
            parameters: selectedQueryLanguageParameters,
          },
        ),
      );

    (async () => {
      // Set the query language output
      debounceUpdateSearchBarTimer.current &&
        clearTimeout(debounceUpdateSearchBarTimer.current);
      // Debounce the updating of the search bar state
      debounceUpdateSearchBarTimer.current = setTimeout(async () => {
        if (!isMounted) return;
        const queryLanguageOutput = await searchBarQueryLanguages[
          queryLanguage.id
        ].run(input, {
          onSearch: _onSearch,
          setInput,
          closeSuggestionPopover: () => setIsOpenSuggestionPopover(false),
          openSuggestionPopover: () => setIsOpenSuggestionPopover(true),
          setQueryLanguageConfiguration: (configuration: any) =>
            setQueryLanguage(state => ({
              ...state,
              configuration:
                configuration?.(state.configuration) || configuration,
            })),
          setQueryLanguageOutput: setQueryLanguageOutputRun,
          inputRef,
          queryLanguage: {
            configuration: queryLanguage.configuration,
            parameters: selectedQueryLanguageParameters,
          },
        });
        queryLanguageOutputRunPreviousOutput.current = {
          ...queryLanguageOutputRun.output,
        };
        setQueryLanguageOutputRun(queryLanguageOutput);
      }, SEARCH_BAR_DEBOUNCE_UPDATE_TIME);
    })();

    return () => {
      isMounted = false;
      debounceUpdateSearchBarTimer.current &&
        clearTimeout(debounceUpdateSearchBarTimer.current);
    };
  }, [input, queryLanguage, selectedQueryLanguageParameters?.options]);

  useEffect(() => {
    if (!onChange) return;

    if (
      // Ensure the previous output is different to the new one
      !_.isEqual(
        queryLanguageOutputRun.output,
        queryLanguageOutputRunPreviousOutput.current,
      )
    ) {
      onChange(queryLanguageOutputRun.output);
    }
  }, [queryLanguageOutputRun.output]);

  const onQueryLanguagePopoverSwitch = () =>
    setIsOpenPopoverQueryLanguage(state => !state);

  const searchBar = (
    <>
      <EuiSuggest
        inputRef={inputRef}
        value={input}
        onChange={onChangeInput}
        onKeyPress={onKeyPressHandler}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onInputChange={() => {}} /* This method is run by EuiSuggest when there is a change in
                                  a div wrapper of the input and should be defined. Defining this
                                  property prevents an error. */
        suggestions={[]}
        isPopoverOpen={
          queryLanguageOutputRun?.searchBarProps?.suggestions?.length > 0 &&
          isOpenSuggestionPopover
        }
        onClosePopover={() => setIsOpenSuggestionPopover(false)}
        onPopoverFocus={() => setIsOpenSuggestionPopover(true)}
        placeholder={'Search'}
        append={
          <EuiPopover
            button={
              <EuiButtonEmpty onClick={onQueryLanguagePopoverSwitch}>
                {searchBarQueryLanguages[queryLanguage.id].label}
              </EuiButtonEmpty>
            }
            isOpen={isOpenPopoverQueryLanguage}
            closePopover={onQueryLanguagePopoverSwitch}
          >
            <EuiPopoverTitle>SYNTAX OPTIONS</EuiPopoverTitle>
            <div style={{ width: '350px' }}>
              <EuiText>
                {searchBarQueryLanguages[queryLanguage.id].description}
              </EuiText>
              {searchBarQueryLanguages[queryLanguage.id].documentationLink && (
                <>
                  <EuiSpacer />
                  <div>
                    <EuiLink
                      href={
                        searchBarQueryLanguages[queryLanguage.id]
                          .documentationLink
                      }
                      target='__blank'
                      rel='noopener noreferrer'
                    >
                      Documentation
                    </EuiLink>
                  </div>
                </>
              )}
              {modes?.length > 1 && (
                <>
                  <EuiSpacer />
                  <EuiFormRow label='Select a query language' fullWidth>
                    <EuiSelect
                      id='query-language-selector'
                      options={modes.map(({ id }) => ({
                        value: id,
                        text: searchBarQueryLanguages[id].label,
                      }))}
                      value={queryLanguage.id}
                      onChange={(
                        event: React.ChangeEvent<HTMLSelectElement>,
                      ) => {
                        const queryLanguageID: string = event.target.value;
                        setQueryLanguage({
                          id: queryLanguageID,
                          configuration:
                            searchBarQueryLanguages[
                              queryLanguageID
                            ]?.getConfiguration?.() || {},
                        });
                        setInput('');
                      }}
                      aria-label='query-language-selector'
                    />
                  </EuiFormRow>
                </>
              )}
            </div>
          </EuiPopover>
        }
        {...queryLanguageOutputRun.searchBarProps}
        {...(queryLanguageOutputRun.searchBarProps?.onItemClick
          ? {
              onItemClick:
                queryLanguageOutputRun.searchBarProps?.onItemClick(input),
            }
          : {})}
      />
    </>
  );
  return rest.buttonsRender || queryLanguageOutputRun.filterButtons ? (
    <EuiFlexGroup>
      <EuiFlexItem>{searchBar}</EuiFlexItem>
      {rest.buttonsRender && (
        <EuiFlexItem grow={false}>{rest.buttonsRender()}</EuiFlexItem>
      )}
      {queryLanguageOutputRun.filterButtons && (
        <EuiFlexItem grow={false}>
          {queryLanguageOutputRun.filterButtons}
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  ) : (
    searchBar
  );
};
