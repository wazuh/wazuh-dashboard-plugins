import React from 'react';
import { EuiButtonEmpty, EuiPopover, EuiText, EuiCode } from '@elastic/eui';
import { webDocumentationLink } from '../../../../common/services/web_documentation';

type ITokenType =
  | 'field'
  | 'operator_compare'
  | 'operator_group'
  | 'value'
  | 'conjunction';
type IToken = { type: ITokenType; value: string };
type ITokens = IToken[];

/* API Query Language
https://documentation.wazuh.com/current/user-manual/api/queries.html

Syntax schema:
<operator_group>?<field><operator_compare><value><operator_conjunction>?<operator_group>?
*/

// Language definition
const language = {
  // Tokens
  tokens: {
    field: {
      regex: /[\w.]/,
    },
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

type ITokenizerInput = { input: string; output?: ITokens };

/**
 * Tokenize the input string. Returns an array with the tokens.
 * @param param0
 * @returns
 */
export function tokenizer({ input, output = [] }: ITokenizerInput): ITokens {
  if (!input) {
    return output;
  }
  const character = input[0];

  // When there is no tokens, the first expected values are:
  if (!output.length) {
    // A literal `(`
    if (character === '(') {
      output.push({ type: 'operator_group', value: '(' });
    }

    // Any character that matches the regex for the field
    if (language.tokens.field.regex.test(character)) {
      output.push({ type: 'field', value: character });
    }
  } else {
    // Get the last token
    const lastToken = output[output.length - 1];

    switch (lastToken.type) {
      // Token: field
      case 'field': {
        if (
          Object.keys(language.tokens.operator_compare.literal)
            .map(str => str[0])
            .includes(character)
        ) {
          // If the character is the first character of an operator_compare token,
          // add a new token with the input character
          output.push({ type: 'operator_compare', value: character });
        } else if (
          Object.keys(language.tokens.operator_compare.literal).includes(
            character,
          )
        ) {
          // If the character matches with an operator_compare token,
          // add a new token with the input character
          output.push({ type: 'operator_compare', value: character });
        } else if (language.tokens.field.regex.test(character)) {
          // If the character matches with a character of field,
          // appends the character to the current field token
          lastToken.value = lastToken.value + character;
        }
        break;
      }

      // Token: operator_compare
      case 'operator_compare': {
        if (
          Object.keys(language.tokens.operator_compare.literal)
            .map(str => str[lastToken.value.length])
            .includes(character)
        ) {
          // If the character is included in the operator_compare token,
          // appends the character to the current operator_compare token
          lastToken.value = lastToken.value + character;
        } else {
          // If the character is not a operator_compare token,
          // add a new value token with the character
          output.push({ type: 'value', value: character });
        }
        break;
      }

      // Token: value
      case 'value': {
        if (
          Object.keys(language.tokens.conjunction.literal).includes(character)
        ) {
          // If the character is a conjunction, add a new conjunction token with the character
          output.push({ type: 'conjunction', value: character });
        } else if (character === ')') {
          // If the character is the ")" literal, then add a new operator_group token
          output.push({ type: 'operator_group', value: character });
        } else {
          // Else appends the character to the current value token
          lastToken.value = lastToken.value + character;
        }
        break;
      }

      // Token: conjunction
      case 'conjunction': {
        if (character === '(') {
          // If the character is the "(" literal, then add a new operator_group token
          output.push({ type: 'operator_group', value: character });
        } else if (language.tokens.field.regex.test(character)) {
          // If the character matches with a character of field,
          // appends the character to the current field token
          output.push({ type: 'field', value: character });
        }
        break;
      }

      // Token: operator_group
      case 'operator_group': {
        if (lastToken.value === '(') {
          // If the character is the "(" literal
          if (language.tokens.field.regex.test(character)) {
            // If the character matches with a character of field,
            // appends the character to the current field token
            output.push({ type: 'field', value: character });
          }
        } else if (lastToken.value === ')') {
          if (
            Object.keys(language.tokens.conjunction.literal).includes(character)
          ) {
            // If the character is a conjunction, add a new conjunction token with the character
            output.push({ type: 'conjunction', value: character });
          }
        }
        break;
      }

      default:
    }
  }

  // Split the string from the second character
  const substring = input.substring(1);

  // Call recursively
  return tokenizer({ input: substring, output }, language);
}

/**
 * Check the
 * @param tokens
 * @returns
 */
function validate(tokens: ITokens): boolean {
  // TODO: enhance the validation
  return tokens.every(
    ({ type }, index) =>
      type === ['field', 'operator_compare', 'value', 'conjunction'][index % 4],
  );
}

type OptionSuggestionHandler = (
  currentValue: string | undefined,
  {
    previousField,
    previousOperatorCompare,
  }: { previousField: string; previousOperatorCompare: string },
) => Promise<{ description?: string; label: string; type: string }[]>;

type optionsQL = {
  suggestions: {
    field: OptionSuggestionHandler;
    value: OptionSuggestionHandler;
  };
};

/**
 * Get the last token by type
 * @param tokens Tokens
 * @param tokenType token type to search
 * @returns
 */
function getLastTokenByType(
  tokens: ITokens,
  tokenType: ITokenType,
): IToken | undefined {
  // Find the last token by type
  // Reverse the tokens array and use the Array.protorype.find method
  const shallowCopyArray = Array.from([...tokens]);
  const shallowCopyArrayReversed = shallowCopyArray.reverse();
  const tokenFound = shallowCopyArrayReversed.find(
    ({ type }) => type === tokenType,
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
export async function getSuggestions(tokens: ITokens, options: optionsQL) {
  if (!tokens.length) {
    return [];
  }

  // Get last token
  const lastToken = tokens[tokens.length - 1];

  switch (lastToken.type) {
    case 'field':
      return [
        // fields that starts with the input but is not equals
        ...(await options.suggestions.field()).filter(
          ({ label }) =>
            label.startsWith(lastToken.value) && label !== lastToken.value,
        ),
        // operators if the input field is exact
        ...((await options.suggestions.field()).some(
          ({ label }) => label === lastToken.value,
        )
          ? [
              ...Object.keys(language.tokens.operator_compare.literal).map(
                operator => ({
                  type: 'operator_compare',
                  label: operator,
                  description:
                    language.tokens.operator_compare.literal[operator],
                }),
              ),
            ]
          : []),
      ];
      break;
    case 'operator_compare':
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
        ...(Object.keys(language.tokens.operator_compare.literal).some(
          operator => operator === lastToken.value,
        )
          ? [
              ...(await options.suggestions.value(undefined, {
                previousField: getLastTokenByType(tokens, 'field')!.value,
                previousOperatorCompare: getLastTokenByType(
                  tokens,
                  'operator_compare',
                )!.value,
              })),
            ]
          : []),
      ];
      break;
    case 'value':
      return [
        ...(lastToken.value
          ? [
              {
                type: 'function_search',
                label: 'Search',
                description: 'Run the search query',
              },
            ]
          : []),
        {
          type: 'value',
          label: lastToken.value,
          description: 'Current value',
        },
        ...(await options.suggestions.value(lastToken.value, {
          previousField: getLastTokenByType(tokens, 'field')!.value,
          previousOperatorCompare: getLastTokenByType(
            tokens,
            'operator_compare',
          )!.value,
        })),
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
      break;
    case 'conjunction':
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
        ...(Object.keys(language.tokens.conjunction.literal).some(
          conjunction => conjunction === lastToken.value,
        )
          ? [
              ...(await options.suggestions.field()).map(
                ({ label, description }) => ({
                  type: 'field',
                  label,
                  description,
                }),
              ),
            ]
          : []),
        {
          type: 'operator_group',
          label: '(',
          description: language.tokens.operator_group.literal['('],
        },
      ];
      break;
    case 'operator_group':
      if (lastToken.value === '(') {
        return [
          // fields
          ...(await options.suggestions.field()).map(
            ({ label, description }) => ({ type: 'field', label, description }),
          ),
        ];
      } else if (lastToken.value === ')') {
        return [
          // conjunction
          ...Object.keys(language.tokens.conjunction.literal).map(
            conjunction => ({
              type: 'conjunction',
              label: conjunction,
              description: language.tokens.conjunction.literal[conjunction],
            }),
          ),
        ];
      }
      break;
    default:
      return [];
      break;
  }

  return [];
}

/**
 * Transform the suggestion object to the expected object by EuiSuggestItem
 * @param suggestions
 * @param options
 * @returns
 */
function transformSuggestionsToUI(
  suggestions: { type: string; label: string; description?: string }[],
  mapSuggestionByLanguageToken: any,
) {
  return suggestions.map(({ type, ...rest }) => ({
    type: { ...mapSuggestionByLanguageToken[type] },
    ...rest,
  }));
}

/**
 * Get the output from the input
 * @param input
 * @returns
 */
function getOutput(input: string, options: {implicitQuery?: string} = {}) {
  return {
    language: AQL.id,
    query: `${options?.implicitQuery ?? ''}${input}`,
  };
};

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
    const tokens: ITokens = tokenizer({ input }, language);

    return {
      searchBarProps: {
        // Props that will be used by the EuiSuggest component
        // Suggestions
        suggestions: transformSuggestionsToUI(
          await getSuggestions(tokens, params.queryLanguage.parameters),
          suggestionMappingLanguageTokenType,
        ),
        // Handler to manage when clicking in a suggestion item
        onItemClick: item => {
          // When the clicked item has the `search` iconType, run the `onSearch` function
          if (item.type.iconType === 'search') {
            // Execute the search action
            params.onSearch(getOutput(input, params.queryLanguage.parameters));
          } else {
            // When the clicked item has another iconType
            const lastToken: IToken = tokens[tokens.length - 1];
            // if the clicked suggestion is of same type of last token
            if (
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
          }
          // Change the input
          params.setInput(tokens.map(({ value }) => value).join(''));
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
      },
      output: getOutput(input, params.queryLanguage.parameters),
    };
  },
  transformUnifiedQuery(unifiedQuery) {
    return unifiedQuery;
  },
};
