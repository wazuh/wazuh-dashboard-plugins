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
} from '@elastic/eui';
import { EuiSuggest } from '../eui-suggest';
import { searchBarQueryLanguages } from './query-language';
import _ from 'lodash';

type SearchBarProps = {
  defaultMode?: string;
  modes: { id: string; [key: string]: any }[];
  onChange?: (params: any) => void;
  onSearch: (params: any) => void;
  input?: string;
};

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
  const [input, setInput] = useState<string | undefined>('');
  // Query language output of run method
  const [queryLanguageOutputRun, setQueryLanguageOutputRun] = useState<any>({
    searchBarProps: { suggestions: [] },
    output: undefined,
  });
  // Cache the previous output
  const queryLanguageOutputRunPreviousOutput = useRef(queryLanguageOutputRun.output);
  // Controls when the suggestion popover is open/close
  const [isOpenSuggestionPopover, setIsOpenSuggestionPopover] =
    useState<boolean>(false);
  // Reference to the input
  const inputRef = useRef();

  // Handler when searching
  const _onSearch = (output: any) => {
    // TODO: fix when searching
    onSearch(output);
    setIsOpenSuggestionPopover(false);
  };

  // Handler on change the input field text
  const onChangeInput = (event: React.ChangeEvent<HTMLInputElement>) =>
    setInput(event.target.value);

  // Handler when pressing a key
  const onKeyPressHandler = event => {
    if (event.key === 'Enter') {
      _onSearch(queryLanguageOutputRun.output);
    }
  };

  const selectedQueryLanguageParameters = modes.find(({ id }) => id === queryLanguage.id);

  useEffect(() => {
    // React to external changes and set the internal input text. Use the `transformUQLToQL` of
    // the query language in use
    rest.input && setInput(
      searchBarQueryLanguages[queryLanguage.id]?.transformUQLToQL?.(
        rest.input,
      ),
    );
  }, [rest.input]);

  useEffect(() => {
    (async () => {
      // Set the query language output
      const queryLanguageOutput = await searchBarQueryLanguages[queryLanguage.id].run(input, {
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
        ...queryLanguageOutputRun.output
      };
      setQueryLanguageOutputRun(queryLanguageOutput);
    })();
  }, [input, queryLanguage, selectedQueryLanguageParameters?.options]);

  useEffect(() => {
    onChange
    // Ensure the previous output is different to the new one
    && !_.isEqual(queryLanguageOutputRun.output, queryLanguageOutputRunPreviousOutput.current)
    && onChange(queryLanguageOutputRun.output);
  }, [queryLanguageOutputRun.output]);

  const onQueryLanguagePopoverSwitch = () =>
    setIsOpenPopoverQueryLanguage(state => !state);

  return (
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
          <div style={{width: '350px'}}>
            <EuiText>
              {searchBarQueryLanguages[queryLanguage.id].description}
            </EuiText>
            {searchBarQueryLanguages[queryLanguage.id].documentationLink && (
              <>
                <EuiSpacer />
                <div>
                  <EuiLink
                    href={
                      searchBarQueryLanguages[queryLanguage.id].documentationLink
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
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
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
    />
  );
};
