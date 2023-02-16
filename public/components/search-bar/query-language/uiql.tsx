import React from 'react';
import { EuiButtonEmpty, EuiPopover, EuiText, EuiCode } from '@elastic/eui';

/* UI Query language
https://documentation.wazuh.com/current/user-manual/api/queries.html

// Example of another query language definition
*/

/**
 * Get the output from the input
 * @param input
 * @returns
 */
function getOutput(input: string, options: {implicitQuery?: string} = {}) {
  return {
    language: UIQL.id,
    query: `${options?.implicitQuery ?? ''}${input}`,
  };
};

export const UIQL = {
  id: 'uiql',
  label: 'UIQL',
  description: 'UIQL allows to do queries.',
  documentationLink: '',
  getConfiguration() {
    return {
      anotherProp: false,
    };
  },
  async run(input, params) {
    // Get the tokens from the input
    return {
      searchBarProps: {
        // Props that will be used by the EuiSuggest component
        // Suggestions
        suggestions: [],
        // Handler to manage when clicking in a suggestion item
        prepend: params.queryLanguage.parameters.implicitQuery ? (
          <EuiPopover
            button={
              <EuiButtonEmpty
                onClick={() =>
                  params.setQueryLanguageConfiguration(state => ({
                    ...state,
                    anotherProp: !state.anotherProp,
                  }))
                }
                iconType='filter'
              ></EuiButtonEmpty>
            }
            isOpen={params.queryLanguage.configuration.anotherProp}
            closePopover={() =>
              params.setQueryLanguageConfiguration(state => ({
                ...state,
                anotherProp: false,
              }))
            }
          >
            <EuiText>
              Implicit UIQL query:{' '}
              <EuiCode>{params.queryLanguage.parameters.implicitQuery}</EuiCode>
            </EuiText>
          </EuiPopover>
        ) : null,
      },
      output: getOutput(input, params.queryLanguage.parameters),
    };
  },
};
