import React from 'react';
import { EuiButtonEmpty, EuiPopover, EuiText, EuiCode } from '@elastic/eui';
import { webDocumentationLink } from '../../../../common/services/web_documentation';

const AQL_ID = 'aql';
const QUERY_TOKEN_KEYS = {
  FIELD: 'field',
  OPERATOR_COMPARE: 'operator_compare',
  OPERATOR_GROUP: 'operator_group',
  VALUE: 'value',
  CONJUNCTION: 'conjunction',
  FUNCTION_SEARCH: 'function_search',
} as const;

type TokenTypeEnum = (typeof QUERY_TOKEN_KEYS)[keyof typeof QUERY_TOKEN_KEYS];

const GROUP_OPERATOR_BOUNDARY = {
  OPEN: 'operator_group_open',
  CLOSE: 'operator_group_close',
};
const OPERATOR_COMPARE = {
  EQUALITY: '=',
  NOT_EQUALITY: '!=',
  BIGGER: '>',
  SMALLER: '<',
  LIKE_AS: '~',
} as const;

type OperatorCompare = (typeof OPERATOR_COMPARE)[keyof typeof OPERATOR_COMPARE];

const OPERATOR_GROUP = {
  OPEN: '(',
  CLOSE: ')',
} as const;

type OperatorGroup = (typeof OPERATOR_GROUP)[keyof typeof OPERATOR_GROUP];

const CONJUNCTION = {
  AND: ';',
  OR: ',',
} as const;

type Conjunction = (typeof CONJUNCTION)[keyof typeof CONJUNCTION];

interface TokenDescriptor {
  type: TokenTypeEnum;
  value: OperatorCompare | OperatorGroup | Conjunction;
}
type TokenList = TokenDescriptor[];

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
export const LANGUAGE = {
  // Tokens
  tokens: {
    [QUERY_TOKEN_KEYS.OPERATOR_COMPARE]: {
      literal: {
        [OPERATOR_COMPARE.EQUALITY]: 'equality',
        [OPERATOR_COMPARE.NOT_EQUALITY]: 'not equality',
        [OPERATOR_COMPARE.BIGGER]: 'bigger',
        [OPERATOR_COMPARE.SMALLER]: 'smaller',
        [OPERATOR_COMPARE.LIKE_AS]: 'like as',
      },
    },
    [QUERY_TOKEN_KEYS.CONJUNCTION]: {
      literal: {
        [CONJUNCTION.AND]: 'and',
        [CONJUNCTION.OR]: 'or',
      },
    },
    [QUERY_TOKEN_KEYS.OPERATOR_GROUP]: {
      literal: {
        [OPERATOR_GROUP.OPEN]: 'open group',
        [OPERATOR_GROUP.CLOSE]: 'close group',
      },
    },
  },
} as const;

const OPERATORS = Object.keys(
  LANGUAGE.tokens.operator_compare.literal,
) as OperatorCompare[];
const CONJUNCTIONS = Object.keys(
  LANGUAGE.tokens.conjunction.literal,
) as Conjunction[];
// Suggestion mapper by language token type
const SUGGESTION_MAPPING_LANGUAGE_TOKEN_TYPE = {
  [QUERY_TOKEN_KEYS.FIELD]: { iconType: 'kqlField', color: 'tint4' },
  [QUERY_TOKEN_KEYS.OPERATOR_COMPARE]: {
    iconType: 'kqlOperand',
    color: 'tint1',
  },
  [QUERY_TOKEN_KEYS.VALUE]: { iconType: 'kqlValue', color: 'tint0' },
  [QUERY_TOKEN_KEYS.CONJUNCTION]: { iconType: 'kqlSelector', color: 'tint3' },
  [QUERY_TOKEN_KEYS.OPERATOR_GROUP]: {
    iconType: 'tokenDenseVector',
    color: 'tint3',
  },
  [QUERY_TOKEN_KEYS.FUNCTION_SEARCH]: { iconType: 'search', color: 'tint5' },
} as const;

/**
 * Creator of intermediate interface of EuiSuggestItem
 * @param type
 * @returns
 */
function mapSuggestionCreator(type: TokenTypeEnum) {
  return function ({ ...params }) {
    return {
      type,
      ...params,
    };
  };
}

const mapSuggestionCreatorField = mapSuggestionCreator(QUERY_TOKEN_KEYS.FIELD);
const mapSuggestionCreatorValue = mapSuggestionCreator(QUERY_TOKEN_KEYS.VALUE);

/**
 * Tokenize the input string. Returns an array with the tokens.
 * @param input
 * @returns
 */
export function tokenizer(input: string): TokenList {
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
    String.raw`(?<${GROUP_OPERATOR_BOUNDARY.OPEN}>\()?` +
      // Field name: name of the field to look on DB.
      String.raw`(?<${QUERY_TOKEN_KEYS.FIELD}>[\w.]+)?` + // Added an optional find
      // Operator: looks for '=', '!=', '<', '>' or '~'.
      // This seems to be a bug because is not searching the literal valid operators.
      // I guess the operator is validated after the regular expression matches
      `(?<${QUERY_TOKEN_KEYS.OPERATOR_COMPARE}>[${Object.keys(
        LANGUAGE.tokens.operator_compare.literal,
      )}]{1,2})?` + // Added an optional find
      // Value: A string.
      String.raw`(?<${QUERY_TOKEN_KEYS.VALUE}>(?:(?:\((?:\[[\[\]\w _\-.,:?\\/'"=@%<>{}]*]|[\[\]\w _\-.:?\/'"=@%<>{}]*)\))*` +
      String.raw`(?:\[[\[\]\w _\-.,:?\\/'"=@%<>{}]*]|[\[\]\w _\-.:?\\/'"=@%<>{}]+)` +
      String.raw`(?:\((?:\[[\[\]\w _\-.,:?\\/'"=@%<>{}]*]|[\[\]\w _\-.:?\\/'"=@%<>{}]*)\))*)+)?` + // Added an optional find
      // A ) character.
      String.raw`(?<${GROUP_OPERATOR_BOUNDARY.CLOSE}>\))?` +
      `(?<${QUERY_TOKEN_KEYS.CONJUNCTION}>[${CONJUNCTIONS}])?`,
    'g',
  );

  return [...input.matchAll(re)].flatMap(({ groups }) =>
    Object.entries(groups || {}).map(([key, value]) => ({
      type: key.startsWith(QUERY_TOKEN_KEYS.OPERATOR_GROUP)
        ? QUERY_TOKEN_KEYS.OPERATOR_GROUP
        : key,
      value,
    })),
  ) as TokenList;
}

interface QLOptionSuggestionEntityItem {
  description?: string;
  label?: string;
}

type QLOptionSuggestionEntityItemTyped = QLOptionSuggestionEntityItem & {
  type: TokenTypeEnum;
};

type SuggestItem = QLOptionSuggestionEntityItem & {
  type: { iconType: string; color: string };
};

type QLOptionSuggestionHandler = (
  currentValue?: string | undefined,
  options?: { previousField: string; previousOperatorCompare: string },
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
function getLastTokenWithValue(tokens: TokenList): TokenDescriptor | undefined {
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
  tokens: TokenList,
  tokenType: TokenTypeEnum,
): TokenDescriptor | undefined {
  // Find the last token by type
  // Reverse the tokens array and use the Array.protorype.find method
  const shallowCopyArray = [...tokens];
  const shallowCopyArrayReversed = shallowCopyArray.reverse();
  const tokenFound = shallowCopyArrayReversed.find(
    ({ type, value }) => type === tokenType && value,
  );

  return tokenFound;
}

const getValueSuggestions = async (
  tokens: TokenDescriptor[],
  options: OptionsQL,
  suggestionValue?: string,
) => {
  const previousField = (
    getLastTokenWithValueByType(
      tokens,
      QUERY_TOKEN_KEYS.FIELD,
    ) as TokenDescriptor
  ).value;
  const previousOperatorCompare = (
    getLastTokenWithValueByType(
      tokens,
      QUERY_TOKEN_KEYS.OPERATOR_COMPARE,
    ) as TokenDescriptor
  ).value;
  const suggestions = await options.suggestions.value(suggestionValue, {
    previousField,
    previousOperatorCompare,
  });

  return suggestions.map(element => mapSuggestionCreatorValue(element));
};

/**
 * Get the suggestions from the tokens
 * @param tokens
 * @param language
 * @param options
 * @returns
 */
export async function getSuggestions(
  tokens: TokenList,
  options: OptionsQL,
): Promise<QLOptionSuggestionEntityItemTyped[]> {
  if (tokens.length === 0) {
    return [];
  }

  const suggestions = await options.suggestions.field();
  // Get last token
  const lastToken = getLastTokenWithValue(tokens);

  // If it can't get a token with value, then returns fields and open operator group
  if (!lastToken?.type) {
    return [
      // fields
      ...suggestions.map(element => mapSuggestionCreatorField(element)),
      {
        type: QUERY_TOKEN_KEYS.OPERATOR_GROUP,
        label: OPERATOR_GROUP.OPEN,
        description:
          LANGUAGE.tokens.operator_group.literal[OPERATOR_GROUP.OPEN],
      },
    ];
  }

  switch (lastToken.type) {
    case QUERY_TOKEN_KEYS.FIELD: {
      return [
        // fields that starts with the input but is not equals
        ...suggestions
          .filter(
            ({ label }) =>
              label?.startsWith(lastToken.value) && label !== lastToken.value,
          )
          .map(element => mapSuggestionCreatorField(element)),
        // operators if the input field is exact
        ...(suggestions.some(({ label }) => label === lastToken.value)
          ? OPERATORS.map(operator => ({
              type: QUERY_TOKEN_KEYS.OPERATOR_COMPARE,
              label: operator,
              description: LANGUAGE.tokens.operator_compare.literal[operator],
            }))
          : []),
      ];
    }

    case QUERY_TOKEN_KEYS.OPERATOR_COMPARE: {
      const getOperatorSuggestions = async (lastToken: TokenDescriptor) => {
        const compareOperatorSuggestions = OPERATORS.filter(
          operator =>
            operator.startsWith(lastToken.value) &&
            operator !== lastToken.value,
        ).map(operator => ({
          type: QUERY_TOKEN_KEYS.OPERATOR_COMPARE,
          label: operator,
          description: LANGUAGE.tokens.operator_compare.literal[operator],
        }));

        return compareOperatorSuggestions;
      };

      return [
        ...(await getOperatorSuggestions(lastToken)),
        ...(OPERATORS.includes(lastToken.value as OperatorCompare)
          ? await getValueSuggestions(tokens, options)
          : []),
      ];
    }

    case QUERY_TOKEN_KEYS.VALUE: {
      return [
        ...(lastToken.value
          ? [
              {
                type: QUERY_TOKEN_KEYS.FUNCTION_SEARCH,
                label: 'Search',
                description: 'run the search query',
              },
            ]
          : []),
        ...(await getValueSuggestions(tokens, options, lastToken.value)),
        ...Object.entries(LANGUAGE.tokens.conjunction.literal).map(
          ([conjunction, description]) => ({
            type: QUERY_TOKEN_KEYS.CONJUNCTION,
            label: conjunction,
            description,
          }),
        ),
        {
          type: QUERY_TOKEN_KEYS.OPERATOR_GROUP,
          label: ')',
          description: LANGUAGE.tokens.operator_group.literal[')'],
        },
      ];
    }

    case QUERY_TOKEN_KEYS.CONJUNCTION: {
      return [
        ...CONJUNCTIONS.filter(
          conjunction =>
            conjunction.startsWith(lastToken.value) &&
            conjunction !== lastToken.value,
        ).map(conjunction => ({
          type: QUERY_TOKEN_KEYS.CONJUNCTION,
          label: conjunction,
          description: LANGUAGE.tokens.conjunction.literal[conjunction],
        })),
        // fields if the input field is exact
        ...(CONJUNCTIONS.includes(lastToken.value as Conjunction)
          ? suggestions.map(element => mapSuggestionCreatorField(element))
          : []),
        {
          type: QUERY_TOKEN_KEYS.OPERATOR_GROUP,
          label: OPERATOR_GROUP.OPEN,
          description:
            LANGUAGE.tokens.operator_group.literal[OPERATOR_GROUP.OPEN],
        },
      ];
    }

    case QUERY_TOKEN_KEYS.OPERATOR_GROUP: {
      if (lastToken.value === OPERATOR_GROUP.OPEN) {
        return (
          // fields
          suggestions.map(element => mapSuggestionCreatorField(element))
        );
      } else if (lastToken.value === ')') {
        return (
          // conjunction
          CONJUNCTIONS.map(conjunction => ({
            type: QUERY_TOKEN_KEYS.CONJUNCTION,
            label: conjunction,
            description: LANGUAGE.tokens.conjunction.literal[conjunction],
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
    type: { ...SUGGESTION_MAPPING_LANGUAGE_TOKEN_TYPE[type] },
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
    language: AQL_ID,
    query: unifiedQuery,
    unifiedQuery,
  };
}

export const AQL = {
  id: AQL_ID,
  label: 'AQL',
  description: 'API Query Language (AQL) allows to do queries.',
  documentationLink: webDocumentationLink('user-manual/api/queries.html'),
  getConfiguration() {
    return {
      isOpenPopoverImplicitFilter: false,
    };
  },
  async run(input: string, params) {
    // Get the tokens from the input
    const tokens: TokenList = tokenizer(input);

    return {
      searchBarProps: {
        // Props that will be used by the EuiSuggest component
        // Suggestions
        suggestions: transformSuggestionsToEuiSuggestItem(
          await getSuggestions(tokens, params.queryLanguage.parameters),
        ),
        // Handler to manage when clicking in a suggestion item
        onItemClick: (currentInput: string) => item => {
          // When the clicked item has the `search` iconType, run the `onSearch` function
          if (item.type.iconType === 'search') {
            // Execute the search action
            params.onSearch(
              getOutput(currentInput, params.queryLanguage.parameters),
            );
          } else {
            // When the clicked item has another iconType
            const lastToken = getLastTokenWithValue(tokens);

            // if the clicked suggestion is of same type of last token
            if (
              lastToken &&
              SUGGESTION_MAPPING_LANGUAGE_TOKEN_TYPE[lastToken.type]
                .iconType === item.type.iconType
            ) {
              // replace the value of last token
              lastToken.value = item.label;
            } else {
              // add a new token of the selected type and value
              const type = Object.entries(
                SUGGESTION_MAPPING_LANGUAGE_TOKEN_TYPE,
              ).find(
                ([, { iconType }]) => iconType === item.type.iconType,
              )?.[0] as TokenTypeEnum;

              tokens.push({
                type,
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
