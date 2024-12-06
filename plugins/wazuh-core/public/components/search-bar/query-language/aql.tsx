/* eslint-disable unicorn/no-await-expression-member */
import React from 'react';
import { EuiButtonEmpty, EuiPopover, EuiText, EuiCode } from '@elastic/eui';
import { webDocumentationLink } from '../../../../common/services/web_documentation';

type ITokenType =
  | 'field'
  | 'operator_compare'
  | 'operator_group'
  | 'value'
  | 'conjunction';
interface IToken {
  type: ITokenType;
  value: string;
}
type ITokens = IToken[];

/* API Query Language
Define the API Query Language to use in the search bar.
It is based in the language used by the q query parameter.
https://documentation.wazuh.com/current/user-manual/api/queries.html

Use the regular expression of API with some modifications to allow the decomposition of
input in entities that doesn't compose a valid query. It allows get not-completed queries.

API schema:
<operator_group>?<field><operator_compare><value><operator_conjunction>?<operator_group>?

Implemented schema:
<operator_group>?<field>?<operator_compare>?<value>?<operator_conjunction>?<operator_group>?
*/

// Language definition
export const language = {
  // Tokens
  tokens: {
    // eslint-disable-next-line camelcase
    operator_compare: {
      literal: {
        '=': 'equality',
        '!=': 'not equality',
        '>': 'bigger',
        '<': 'smaller',
        '~': 'like as',
      },
    },
    conjunction: {
      literal: {
        ';': 'and',
        ',': 'or',
      },
    },
    // eslint-disable-next-line camelcase
    operator_group: {
      literal: {
        '(': 'open group',
        ')': 'close group',
      },
    },
  },
};

// Suggestion mapper by language token type
const suggestionMappingLanguageTokenType = {
  field: { iconType: 'kqlField', color: 'tint4' },
  // eslint-disable-next-line camelcase
  operator_compare: { iconType: 'kqlOperand', color: 'tint1' },
  value: { iconType: 'kqlValue', color: 'tint0' },
  conjunction: { iconType: 'kqlSelector', color: 'tint3' },
  // eslint-disable-next-line camelcase
  operator_group: { iconType: 'tokenDenseVector', color: 'tint3' },
  // eslint-disable-next-line camelcase
  function_search: { iconType: 'search', color: 'tint5' },
};

/**
 * Creator of intermediate interface of EuiSuggestItem
 * @param type
 * @returns
 */
function mapSuggestionCreator(type: ITokenType) {
  return function ({ ...params }) {
    return {
      type,
      ...params,
    };
  };
}

const mapSuggestionCreatorField = mapSuggestionCreator('field');
const mapSuggestionCreatorValue = mapSuggestionCreator('value');

/**
 * Tokenize the input string. Returns an array with the tokens.
 * @param input
 * @returns
 */
export function tokenizer(input: string): ITokens {
  // API regular expression
  // https://github.com/wazuh/wazuh/blob/v4.4.0-rc1/framework/wazuh/core/utils.py#L1242-L1257
  //   self.query_regex = re.compile(
  //     # A ( character.
  //     r"(\()?" +
  //     # Field name: name of the field to look on DB.
  //     r"([\w.]+)" +
  //     # Operator: looks for '=', '!=', '<', '>' or '~'.
  //     rf"([{''.join(self.query_operators.keys())}]{{1,2}})" +
  //     # Value: A string.
  //     r"((?:(?:\((?:\[[\[\]\w _\-.,:?\\/'\"=@%<>{}]*]|[\[\]\w _\-.:?\\/'\"=@%<>{}]*)\))*"
  //     r"(?:\[[\[\]\w _\-.,:?\\/'\"=@%<>{}]*]|[\[\]\w _\-.:?\\/'\"=@%<>{}]+)"
  //     r"(?:\((?:\[[\[\]\w _\-.,:?\\/'\"=@%<>{}]*]|[\[\]\w _\-.:?\\/'\"=@%<>{}]*)\))*)+)" +
  //     # A ) character.
  //     r"(\))?" +
  //     # Separator: looks for ';', ',' or nothing.
  //     rf"([{''.join(self.query_separators.keys())}])?"
  // )

  const re = new RegExp(
    // The following regular expression is based in API one but was modified to use named groups
    // and added the optional operator to allow matching the entities when the query is not
    // completed. This helps to tokenize the query and manage when the input is not completed.
    // A ( character.
    String.raw`(?<operator_group_open>\()?` +
      // Field name: name of the field to look on DB.
      String.raw`(?<field>[\w.]+)?` + // Added an optional find
      // Operator: looks for '=', '!=', '<', '>' or '~'.
      // This seems to be a bug because is not searching the literal valid operators.
      // I guess the operator is validated after the regular expression matches
      `(?<operator_compare>[${Object.keys(
        language.tokens.operator_compare.literal,
      )}]{1,2})?` + // Added an optional find
      // Value: A string.
      String.raw`(?<value>(?:(?:\((?:\[[\[\]\w _\-.,:?\\/'"=@%<>{}]*]|[\[\]\w _\-.:?\/'"=@%<>{}]*)\))*` +
      String.raw`(?:\[[\[\]\w _\-.,:?\\/'"=@%<>{}]*]|[\[\]\w _\-.:?\\/'"=@%<>{}]+)` +
      String.raw`(?:\((?:\[[\[\]\w _\-.,:?\\/'"=@%<>{}]*]|[\[\]\w _\-.:?\\/'"=@%<>{}]*)\))*)+)?` + // Added an optional find
      // A ) character.
      String.raw`(?<operator_group_close>\))?` +
      `(?<conjunction>[${Object.keys(language.tokens.conjunction.literal)}])?`,
    'g',
  );

  return [...input.matchAll(re)].flatMap(({ groups }) =>
    Object.entries(groups).map(([key, value]) => ({
      type: key.startsWith('operator_group') ? 'operator_group' : key,
      value,
    })),
  );
}

interface QLOptionSuggestionEntityItem {
  description?: string;
  label: string;
}

type QLOptionSuggestionEntityItemTyped = QLOptionSuggestionEntityItem & {
  type:
    | 'operator_group'
    | 'field'
    | 'operator_compare'
    | 'value'
    | 'conjunction';
};

type SuggestItem = QLOptionSuggestionEntityItem & {
  type: { iconType: string; color: string };
};

type QLOptionSuggestionHandler = (
  currentValue: string | undefined,
  {
    previousField,
    previousOperatorCompare,
  }: { previousField: string; previousOperatorCompare: string },
) => Promise<QLOptionSuggestionEntityItem[]>;

interface OptionsQL {
  suggestions: {
    field: QLOptionSuggestionHandler;
    value: QLOptionSuggestionHandler;
  };
}

/**
 * Get the last token with value
 * @param tokens Tokens
 * @param tokenType token type to search
 * @returns
 */
function getLastTokenWithValue(tokens: ITokens): IToken | undefined {
  // Reverse the tokens array and use the Array.protorype.find method
  const shallowCopyArray = [...tokens];
  const shallowCopyArrayReversed = shallowCopyArray.reverse();
  const tokenFound = shallowCopyArrayReversed.find(({ value }) => value);

  return tokenFound;
}

/**
 * Get the last token with value by type
 * @param tokens Tokens
 * @param tokenType token type to search
 * @returns
 */
function getLastTokenWithValueByType(
  tokens: ITokens,
  tokenType: ITokenType,
): IToken | undefined {
  // Find the last token by type
  // Reverse the tokens array and use the Array.protorype.find method
  const shallowCopyArray = [...tokens];
  const shallowCopyArrayReversed = shallowCopyArray.reverse();
  const tokenFound = shallowCopyArrayReversed.find(
    ({ type, value }) => type === tokenType && value,
  );

  return tokenFound;
}

/**
 * Get the suggestions from the tokens
 * @param tokens
 * @param language
 * @param options
 * @returns
 */
export async function getSuggestions(
  tokens: ITokens,
  options: OptionsQL,
): Promise<QLOptionSuggestionEntityItemTyped[]> {
  if (tokens.length === 0) {
    return [];
  }

  // Get last token
  const lastToken = getLastTokenWithValue(tokens);

  // If it can't get a token with value, then returns fields and open operator group
  if (!lastToken?.type) {
    return [
      // fields
      ...(await options.suggestions.field()).map((element, index, array) =>
        mapSuggestionCreatorField(element, index, array),
      ),
      {
        type: 'operator_group',
        label: '(',
        description: language.tokens.operator_group.literal['('],
      },
    ];
  }

  switch (lastToken.type) {
    case 'field': {
      return [
        // fields that starts with the input but is not equals
        ...(await options.suggestions.field())
          .filter(
            ({ label }) =>
              label.startsWith(lastToken.value) && label !== lastToken.value,
          )
          .map((element, index, array) =>
            mapSuggestionCreatorField(element, index, array),
          ),
        // operators if the input field is exact
        ...((await options.suggestions.field()).some(
          ({ label }) => label === lastToken.value,
        )
          ? Object.keys(language.tokens.operator_compare.literal).map(
              operator => ({
                type: 'operator_compare',
                label: operator,
                description: language.tokens.operator_compare.literal[operator],
              }),
            )
          : []),
      ];
    }

    case 'operator_compare': {
      return [
        ...Object.keys(language.tokens.operator_compare.literal)
          .filter(
            operator =>
              operator.startsWith(lastToken.value) &&
              operator !== lastToken.value,
          )
          .map(operator => ({
            type: 'operator_compare',
            label: operator,
            description: language.tokens.operator_compare.literal[operator],
          })),
        ...(Object.keys(language.tokens.operator_compare.literal).includes(
          lastToken.value,
        )
          ? (
              await options.suggestions.value(undefined, {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                previousField: getLastTokenWithValueByType(tokens, 'field')!
                  .value,
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                previousOperatorCompare: getLastTokenWithValueByType(
                  tokens,
                  'operator_compare',
                )!.value,
              })
            ).map(element => mapSuggestionCreatorValue(element))
          : []),
      ];
    }

    case 'value': {
      return [
        ...(lastToken.value
          ? [
              {
                type: 'function_search',
                label: 'Search',
                description: 'run the search query',
              },
            ]
          : []),
        ...(
          await options.suggestions.value(lastToken.value, {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            previousField: getLastTokenWithValueByType(tokens, 'field')!.value,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            previousOperatorCompare: getLastTokenWithValueByType(
              tokens,
              'operator_compare',
            )!.value,
          })
        ).map(element => mapSuggestionCreatorValue(element)),
        ...Object.entries(language.tokens.conjunction.literal).map(
          ([conjunction, description]) => ({
            type: 'conjunction',
            label: conjunction,
            description,
          }),
        ),
        {
          type: 'operator_group',
          label: ')',
          description: language.tokens.operator_group.literal[')'],
        },
      ];
    }

    case 'conjunction': {
      return [
        ...Object.keys(language.tokens.conjunction.literal)
          .filter(
            conjunction =>
              conjunction.startsWith(lastToken.value) &&
              conjunction !== lastToken.value,
          )
          .map(conjunction => ({
            type: 'conjunction',
            label: conjunction,
            description: language.tokens.conjunction.literal[conjunction],
          })),
        // fields if the input field is exact
        ...(Object.keys(language.tokens.conjunction.literal).includes(
          lastToken.value,
        )
          ? (await options.suggestions.field()).map(element =>
              mapSuggestionCreatorField(element),
            )
          : []),
        {
          type: 'operator_group',
          label: '(',
          description: language.tokens.operator_group.literal['('],
        },
      ];
    }

    case 'operator_group': {
      if (lastToken.value === '(') {
        return (
          // fields
          (await options.suggestions.field()).map(element =>
            mapSuggestionCreatorField(element),
          )
        );
      } else if (lastToken.value === ')') {
        return (
          // conjunction
          Object.keys(language.tokens.conjunction.literal).map(conjunction => ({
            type: 'conjunction',
            label: conjunction,
            description: language.tokens.conjunction.literal[conjunction],
          }))
        );
      }

      break;
    }

    default: {
      return [];
    }
  }

  return [];
}

/**
 * Transform the suggestion object to the expected object by EuiSuggestItem
 * @param param0
 * @returns
 */
export function transformSuggestionToEuiSuggestItem(
  suggestion: QLOptionSuggestionEntityItemTyped,
): SuggestItem {
  const { type, ...rest } = suggestion;

  return {
    type: { ...suggestionMappingLanguageTokenType[type] },
    ...rest,
  };
}

/**
 * Transform the suggestion object to the expected object by EuiSuggestItem
 * @param suggestions
 * @returns
 */
function transformSuggestionsToEuiSuggestItem(
  suggestions: QLOptionSuggestionEntityItemTyped[],
): SuggestItem[] {
  return suggestions.map(element =>
    transformSuggestionToEuiSuggestItem(element),
  );
}

/**
 * Get the output from the input
 * @param input
 * @returns
 */
function getOutput(input: string, options: { implicitQuery?: string } = {}) {
  const unifiedQuery = `${options?.implicitQuery ?? ''}${
    options?.implicitQuery ? `(${input})` : input
  }`;

  return {
    // eslint-disable-next-line no-use-before-define
    language: AQL.id,
    query: unifiedQuery,
    unifiedQuery,
  };
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const AQL = {
  id: 'aql',
  label: 'AQL',
  description: 'API Query Language (AQL) allows to do queries.',
  documentationLink: webDocumentationLink('user-manual/api/queries.html'),
  getConfiguration() {
    return {
      isOpenPopoverImplicitFilter: false,
    };
  },
  async run(input, params) {
    // Get the tokens from the input
    const tokens: ITokens = tokenizer(input);

    return {
      searchBarProps: {
        // Props that will be used by the EuiSuggest component
        // Suggestions
        suggestions: transformSuggestionsToEuiSuggestItem(
          await getSuggestions(tokens, params.queryLanguage.parameters),
        ),
        // Handler to manage when clicking in a suggestion item
        onItemClick: currentInput => item => {
          // When the clicked item has the `search` iconType, run the `onSearch` function
          if (item.type.iconType === 'search') {
            // Execute the search action
            params.onSearch(
              getOutput(currentInput, params.queryLanguage.parameters),
            );
          } else {
            // When the clicked item has another iconType
            const lastToken: IToken = getLastTokenWithValue(tokens);

            // if the clicked suggestion is of same type of last token
            if (
              lastToken &&
              suggestionMappingLanguageTokenType[lastToken.type].iconType ===
                item.type.iconType
            ) {
              // replace the value of last token
              lastToken.value = item.label;
            } else {
              // add a new token of the selected type and value
              tokens.push({
                type: Object.entries(suggestionMappingLanguageTokenType).find(
                  ([, { iconType }]) => iconType === item.type.iconType,
                )[0],
                value: item.label,
              });
            }

            // Change the input
            params.setInput(
              tokens
                .filter(({ value }) => value) // Ensure the input is rebuilt using tokens with value.
                // The input tokenization can contain tokens with no value due to the used
                // regular expression.
                .map(({ value }) => value)
                .join(''),
            );
          }
        },
        prepend: params.queryLanguage.parameters.implicitQuery ? (
          <EuiPopover
            button={
              <EuiButtonEmpty
                onClick={() =>
                  params.setQueryLanguageConfiguration(state => ({
                    ...state,
                    isOpenPopoverImplicitFilter:
                      !state.isOpenPopoverImplicitFilter,
                  }))
                }
                iconType='filter'
              >
                <EuiCode>
                  {params.queryLanguage.parameters.implicitQuery}
                </EuiCode>
              </EuiButtonEmpty>
            }
            isOpen={
              params.queryLanguage.configuration.isOpenPopoverImplicitFilter
            }
            closePopover={() =>
              params.setQueryLanguageConfiguration(state => ({
                ...state,
                isOpenPopoverImplicitFilter: false,
              }))
            }
          >
            <EuiText>
              Implicit query:{' '}
              <EuiCode>{params.queryLanguage.parameters.implicitQuery}</EuiCode>
            </EuiText>
            <EuiText color='subdued'>This query is added to the input.</EuiText>
          </EuiPopover>
        ) : null,
        // Disable the focus trap in the EuiInputPopover.
        // This causes when using the Search suggestion, the suggestion popover can be closed.
        // If this is disabled, then the suggestion popover is open after a short time for this
        // use case.
        disableFocusTrap: true,
      },
      output: getOutput(input, params.queryLanguage.parameters),
    };
  },
  transformUQLToQL(unifiedQuery: string): string {
    return unifiedQuery;
  },
};
