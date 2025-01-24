/* eslint-disable unicorn/no-await-expression-member */
import React from 'react';
import { EuiButtonGroup } from '@elastic/eui';
import { SEARCH_BAR_WQL_VALUE_SUGGESTIONS_DISPLAY_COUNT } from '../../../../common/constants';
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { OmitStrict } from '../../../../common/types';
import { tokenizer as tokenizerUQL } from './aql';
import {
  CONJUNCTION as CONJUNCTION_UQL,
  GROUP_OPERATOR_BOUNDARY,
  ICON_TYPE,
  OPERATOR_COMPARE,
  OPERATOR_GROUP,
} from './constants';

/* UI Query language
https://documentation.wazuh.com/current/user-manual/api/queries.html

// Example of another query language definition
*/

const WQL_ID = 'wql';
const QUERY_TOKEN_KEYS = {
  FIELD: 'field',
  OPERATOR_COMPARE: 'operator_compare',
  OPERATOR_GROUP: 'operator_group',
  VALUE: 'value',
  CONJUNCTION: 'conjunction',
  FUNCTION_SEARCH: 'function_search',
  WHITESPACE: 'whitespace',
  VALIDATION_ERROR: 'validation_error',
} as const;

type TokenTypeEnum = (typeof QUERY_TOKEN_KEYS)[keyof OmitStrict<
  typeof QUERY_TOKEN_KEYS,
  'FUNCTION_SEARCH' | 'VALIDATION_ERROR'
>];
export const CONJUNCTION_WQL = {
  AND: 'and',
  OR: 'or',
} as const;

export type Conjunction =
  (typeof CONJUNCTION_WQL)[keyof typeof CONJUNCTION_WQL];

interface TokenDescriptor {
  type: TokenTypeEnum;
  value: string;
  formattedValue?: string;
}
type TokenList = TokenDescriptor[];

enum MODE {
  PREVIOUS = 'previous',
  NEXT = 'next',
}

/* API Query Language
Define the API Query Language to use in the search bar.
It is based in the language used by the q query parameter.
https://documentation.wazuh.com/current/user-manual/api/queries.html

Use the regular expression of API with some modifications to allow the decomposition of
input in entities that doesn't compose a valid query. It allows get not-completed queries.

API schema:
<operator_group>?<field><operator_compare><value><operator_conjunction>?<operator_group>?

Implemented schema:
<operator_group>?<whitespace>?<field>?<whitespace>?<operator_compare>?<whitespace>?<value>?<whitespace>?<operator_conjunction>?<whitespace>?<operator_group>?<whitespace>?
*/

// Language definition
const language = {
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
    conjunction: {
      literal: {
        [CONJUNCTION_WQL.AND]: 'and',
        [CONJUNCTION_WQL.OR]: 'or',
      },
    },
    [QUERY_TOKEN_KEYS.OPERATOR_GROUP]: {
      literal: {
        [OPERATOR_GROUP.OPEN]: 'open group',
        [OPERATOR_GROUP.CLOSE]: 'close group',
      },
    },
  },
  equivalencesToUQL: {
    conjunction: {
      literal: {
        and: CONJUNCTION_UQL.AND,
        or: CONJUNCTION_UQL.OR,
      },
    },
  },
};
// Suggestion mapper by language token type
const SUGGESTION_MAPPING_LANGUAGE_TOKEN_TYPE = {
  [QUERY_TOKEN_KEYS.FIELD]: { iconType: ICON_TYPE.KQL_FIELD, color: 'tint4' },
  [QUERY_TOKEN_KEYS.OPERATOR_COMPARE]: {
    iconType: ICON_TYPE.KQL_OPERAND,
    color: 'tint1',
  },
  [QUERY_TOKEN_KEYS.VALUE]: { iconType: ICON_TYPE.KQL_VALUE, color: 'tint0' },
  [QUERY_TOKEN_KEYS.CONJUNCTION]: {
    iconType: ICON_TYPE.KQL_SELECTOR,
    color: 'tint3',
  },
  [QUERY_TOKEN_KEYS.OPERATOR_GROUP]: {
    iconType: ICON_TYPE.TOKEN_DENSE_VECTOR,
    color: 'tint3',
  },
  [QUERY_TOKEN_KEYS.FUNCTION_SEARCH]: {
    iconType: ICON_TYPE.SEARCH,
    color: 'tint5',
  },
  [QUERY_TOKEN_KEYS.VALIDATION_ERROR]: {
    iconType: ICON_TYPE.ALERT,
    color: 'tint2',
  },
};

/**
 * Creator of intermediate interface of EuiSuggestItem
 * @param type
 * @returns
 */
function mapSuggestionCreator(type: TokenTypeEnum) {
  return function ({ label, ...params }) {
    return {
      type,
      ...params,
      /* WORKAROUND: ensure the label is a string. If it is not a string, an warning is
      displayed in the console related to prop types
      */
      ...(label === undefined ? {} : { label: String(label) }),
    };
  };
}

const mapSuggestionCreatorField = mapSuggestionCreator(QUERY_TOKEN_KEYS.FIELD);
const mapSuggestionCreatorValue = mapSuggestionCreator(QUERY_TOKEN_KEYS.VALUE);

/**
 * Transform the conjunction to the query language syntax
 * @param conjunction
 * @returns
 */
function transformQLConjunction(conjunction: string): string {
  // If the value has a whitespace or comma, then
  return conjunction === language.equivalencesToUQL.conjunction.literal['and']
    ? ` ${language.tokens.conjunction.literal[CONJUNCTION_WQL.AND]} `
    : ` ${language.tokens.conjunction.literal[CONJUNCTION_WQL.OR]} `;
}

/**
 * Transform the value to the query language syntax
 * @param value
 * @returns
 */
function transformQLValue(value: string): string {
  // If the value has a whitespace or comma, then
  return /[\s"|]/.test(value)
    ? // Escape the commas (") => (\") and wraps the string with commas ("<string>")
      `"${value.replace(/"/, String.raw`\"`)}"`
    : // Raw value
      value;
}

/**
 * Tokenize the input string. Returns an array with the tokens.
 * @param input
 * @returns
 */
export function tokenizer(input: string): TokenList {
  const re = new RegExp(
    // A ( character.
    String.raw`(?<${GROUP_OPERATOR_BOUNDARY.OPEN}>\()?` +
      // Whitespace
      String.raw`(?<${QUERY_TOKEN_KEYS.WHITESPACE}_1>\s+)?` +
      // Field name: name of the field to look on DB.
      String.raw`(?<${QUERY_TOKEN_KEYS.FIELD}>[\w.]+)?` + // Added an optional find
      // Whitespace
      String.raw`(?<${QUERY_TOKEN_KEYS.WHITESPACE}_2>\s+)?` +
      // Operator: looks for '=', '!=', '<', '>' or '~'.
      // This seems to be a bug because is not searching the literal valid operators.
      // I guess the operator is validated after the regular expression matches
      `(?<${QUERY_TOKEN_KEYS.OPERATOR_COMPARE}>[${Object.keys(
        language.tokens.operator_compare.literal,
      )}]{1,2})?` + // Added an optional find
      // Whitespace
      String.raw`(?<${QUERY_TOKEN_KEYS.WHITESPACE}_3>\s+)?` +
      // Value: A string.
      // Simple value
      // Quoted ", "value, "value", "escaped \"quote"
      // Escape quoted string with escaping quotes: https://stackoverflow.com/questions/249791/regex-for-quoted-string-with-escaping-quotes
      String.raw`(?<${QUERY_TOKEN_KEYS.VALUE}>(?:(?:[^"\s]+|(?:"(?:[^"\\]|\\")*")|(?:"(?:[^"\\]|\\")*)|")))?` +
      // Whitespace
      String.raw`(?<${QUERY_TOKEN_KEYS.WHITESPACE}_4>\s+)?` +
      // A ) character.
      String.raw`(?<${GROUP_OPERATOR_BOUNDARY.CLOSE}>\))?` +
      // Whitespace
      String.raw`(?<${QUERY_TOKEN_KEYS.WHITESPACE}_5>\s+)?` +
      `(?<${QUERY_TOKEN_KEYS.CONJUNCTION}>${Object.keys(
        language.tokens.conjunction.literal,
      ).join('|')})?` +
      // Whitespace
      String.raw`(?<${QUERY_TOKEN_KEYS.WHITESPACE}_6>\s+)?`,
    'g',
  );

  return [...input.matchAll(re)].flatMap(({ groups }) =>
    Object.entries(groups).map(([key, value]) => ({
      type: key.startsWith(QUERY_TOKEN_KEYS.OPERATOR_GROUP) // Transform operator_group group match
        ? QUERY_TOKEN_KEYS.OPERATOR_GROUP
        : key.startsWith(QUERY_TOKEN_KEYS.WHITESPACE) // Transform whitespace group match
          ? QUERY_TOKEN_KEYS.WHITESPACE
          : key,
      value,
      ...(key === QUERY_TOKEN_KEYS.VALUE &&
        (value && /^"([\S\s]+)"$/.test(value)
          ? { formattedValue: value.match(/^"([\S\s]+)"$/)[1] }
          : { formattedValue: value })),
    })),
  );
}

interface QLOptionSuggestionEntityItem {
  description?: string;
  label: string;
}

type QLOptionSuggestionEntityItemTyped = QLOptionSuggestionEntityItem & {
  type: (typeof QUERY_TOKEN_KEYS)[keyof OmitStrict<
    typeof QUERY_TOKEN_KEYS,
    'WHITESPACE' | 'VALIDATION_ERROR'
  >];
};

type SuggestItem = QLOptionSuggestionEntityItem & {
  type: { iconType: string; color: string };
};

type QLOptionSuggestionHandler = (
  currentValue: string | undefined,
  { field, operatorCompare }: { field: string; operatorCompare: string },
) => Promise<QLOptionSuggestionEntityItem[]>;

interface OptionsQLImplicitQuery {
  query: string;
  conjunction: string;
}
interface OptionsQL {
  options?: {
    implicitQuery?: OptionsQLImplicitQuery;
    searchTermFields?: string[];
    filterButtons: { id: string; label: string; input: string }[];
  };
  suggestions: {
    field: QLOptionSuggestionHandler;
    value: QLOptionSuggestionHandler;
  };
  validate?: {
    value?: Record<
      string,
      (
        token: TokenDescriptor,
        nearTokens: { field: string; operator: string },
      ) => string | undefined
    >;
  };
}

export interface ISearchBarModeWQL extends OptionsQL {
  id: typeof WQL_ID;
}

/**
 * Get the last token with value
 * @param tokens Tokens
 * @param tokenType token type to search
 * @returns
 */
function getLastTokenDefined(tokens: TokenList): TokenDescriptor | undefined {
  // Reverse the tokens array and use the Array.protorype.find method
  const shallowCopyArray = [...tokens];
  const shallowCopyArrayReversed = shallowCopyArray.reverse();
  const tokenFound = shallowCopyArrayReversed.find(
    ({ type, value }) => type !== QUERY_TOKEN_KEYS.WHITESPACE && value,
  );

  return tokenFound;
}

/**
 * Get the last token with value by type
 * @param tokens Tokens
 * @param tokenType token type to search
 * @returns
 */
function getLastTokenDefinedByType(
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

/**
 * Get the token that is near to a token position of the token type.
 * @param tokens
 * @param tokenReferencePosition
 * @param tokenType
 * @param mode
 * @returns
 */
function getTokenNearTo(
  tokens: TokenList,
  tokenType: TokenTypeEnum,
  mode: MODE = MODE.PREVIOUS,
  options: {
    tokenReferencePosition?: number;
    tokenFoundShouldHaveValue?: boolean;
  } = {},
): TokenDescriptor | undefined {
  const shallowCopyTokens = [...tokens];
  const computedShallowCopyTokens =
    mode === MODE.PREVIOUS
      ? shallowCopyTokens
          .slice(
            0,
            options?.tokenReferencePosition || (tokens.length as number),
          )
          .reverse()
      : shallowCopyTokens.slice(options?.tokenReferencePosition || 0);

  return computedShallowCopyTokens.find(
    ({ type, value }) =>
      type === tokenType && (options?.tokenFoundShouldHaveValue ? value : true),
  );
}

/**
 * It returns the regular expression that validate the token of type value
 * @returns The regular expression
 */
function getTokenValueRegularExpression() {
  return new RegExp(
    // Value: A string.
    String.raw`^(?<${QUERY_TOKEN_KEYS.VALUE}>(?:(?:\((?:\[[\[\]\w _\-.,:?\\/'"=@%<>{}]*]|[\[\]\w _\-.:?\/'"=@%<>{}]*)\))*` +
      String.raw`(?:\[[\[\]\w _\-.,:?\\/'"=@%<>{}]*]|^[\[\]\w _\-.:?\\/'"=@%<>{}]+)` +
      String.raw`(?:\((?:\[[\[\]\w _\-.,:?\\/'"=@%<>{}]*]|[\[\]\w _\-.:?\\/'"=@%<>{}]*)\))*)+)$`,
  );
}

/**
 * It filters the values that matche the validation regular expression and returns the first items
 * defined by SEARCH_BAR_WQL_VALUE_SUGGESTIONS_DISPLAY_COUNT constant.
 * @param suggestions Suggestions provided by the suggestions.value method of each instance of the
 * search bar
 * @returns
 */
function filterTokenValueSuggestion(
  suggestions: QLOptionSuggestionEntityItemTyped[],
) {
  return suggestions
    ? suggestions
        .filter(({ label }: QLOptionSuggestionEntityItemTyped) => {
          const re = getTokenValueRegularExpression();

          return re.test(label);
        })
        .slice(0, SEARCH_BAR_WQL_VALUE_SUGGESTIONS_DISPLAY_COUNT)
    : [];
}

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

  // Get last token
  const lastToken = getLastTokenDefined(tokens);

  // If it can't get a token with value, then returns fields and open operator group
  if (!lastToken?.type) {
    return [
      // Search function
      {
        type: QUERY_TOKEN_KEYS.FUNCTION_SEARCH,
        label: 'Search',
        description: 'run the search query',
      },
      // fields
      ...(await options.suggestions.field()).map((element, index, array) =>
        mapSuggestionCreatorField(element, index, array),
      ),
      {
        type: QUERY_TOKEN_KEYS.OPERATOR_GROUP,
        label: OPERATOR_GROUP.OPEN,
        description:
          language.tokens.operator_group.literal[OPERATOR_GROUP.OPEN],
      },
    ];
  }

  switch (lastToken.type) {
    case QUERY_TOKEN_KEYS.FIELD: {
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
                type: QUERY_TOKEN_KEYS.OPERATOR_COMPARE,
                label: operator,
                description: language.tokens.operator_compare.literal[operator],
              }),
            )
          : []),
      ];
    }

    case QUERY_TOKEN_KEYS.OPERATOR_COMPARE: {
      const field = getLastTokenDefinedByType(
        tokens,
        QUERY_TOKEN_KEYS.FIELD,
      )?.value;
      const operatorCompare = getLastTokenDefinedByType(
        tokens,
        QUERY_TOKEN_KEYS.OPERATOR_COMPARE,
      )?.value;

      // If there is no a previous field, then no return suggestions because it would be an syntax
      // error
      if (!field) {
        return [];
      }

      return [
        ...Object.keys(language.tokens.operator_compare.literal)
          .filter(
            operator =>
              operator.startsWith(lastToken.value) &&
              operator !== lastToken.value,
          )
          .map(operator => ({
            type: QUERY_TOKEN_KEYS.OPERATOR_COMPARE,
            label: operator,
            description: language.tokens.operator_compare.literal[operator],
          })),
        ...(Object.keys(language.tokens.operator_compare.literal).includes(
          lastToken.value,
        )
          ? /*
                WORKAROUND: When getting suggestions for the distinct values for any field, the API
                could reply some values that doesn't match the expected regular expression. If the
                value is invalid, a validation message is displayed and avoid the search can be run.
                The goal of this filter is that the suggested values can be used to search. This
                causes some values could not be displayed as suggestions.
              */
            filterTokenValueSuggestion(
              await options.suggestions.value(undefined, {
                field,
                operatorCompare,
              }),
            ).map((element, index, array) =>
              mapSuggestionCreatorValue(element, index, array),
            )
          : []),
      ];
    }

    case QUERY_TOKEN_KEYS.VALUE: {
      const field = getLastTokenDefinedByType(
        tokens,
        QUERY_TOKEN_KEYS.FIELD,
      )?.value;
      const operatorCompare = getLastTokenDefinedByType(
        tokens,
        QUERY_TOKEN_KEYS.OPERATOR_COMPARE,
      )?.value;

      /* If there is no a previous field or operator_compare, then no return suggestions because
        it would be an syntax error */
      if (!field || !operatorCompare) {
        return [];
      }

      return [
        ...(lastToken.formattedValue
          ? [
              {
                type: QUERY_TOKEN_KEYS.FUNCTION_SEARCH,
                label: 'Search',
                description: 'run the search query',
              },
            ]
          : []),
        /*
          WORKAROUND: When getting suggestions for the distinct values for any field, the API
          could reply some values that doesn't match the expected regular expression. If the
          value is invalid, a validation message is displayed and avoid the search can be run.
          The goal of this filter is that the suggested values can be used to search. This
          causes some values could not be displayed as suggestions.
        */
        ...filterTokenValueSuggestion(
          await options.suggestions.value(lastToken.formattedValue, {
            field,
            operatorCompare,
          }),
        ).map((element, index, array) =>
          mapSuggestionCreatorValue(element, index, array),
        ),
        ...Object.entries(language.tokens.conjunction.literal).map(
          ([conjunction, description]) => ({
            type: QUERY_TOKEN_KEYS.CONJUNCTION,
            label: conjunction,
            description,
          }),
        ),
        {
          type: QUERY_TOKEN_KEYS.OPERATOR_GROUP,
          label: OPERATOR_GROUP.CLOSE,
          description:
            language.tokens.operator_group.literal[OPERATOR_GROUP.CLOSE],
        },
      ];
    }

    case QUERY_TOKEN_KEYS.CONJUNCTION: {
      return [
        ...Object.keys(language.tokens.conjunction.literal)
          .filter(
            conjunction =>
              conjunction.startsWith(lastToken.value) &&
              conjunction !== lastToken.value,
          )
          .map(conjunction => ({
            type: QUERY_TOKEN_KEYS.CONJUNCTION,
            label: conjunction,
            description: language.tokens.conjunction.literal[conjunction],
          })),
        // fields if the input field is exact
        ...(Object.keys(language.tokens.conjunction.literal).includes(
          lastToken.value,
        )
          ? (await options.suggestions.field()).map((element, index, array) =>
              mapSuggestionCreatorField(element, index, array),
            )
          : []),
        {
          type: QUERY_TOKEN_KEYS.OPERATOR_GROUP,
          label: OPERATOR_GROUP.OPEN,
          description:
            language.tokens.operator_group.literal[OPERATOR_GROUP.OPEN],
        },
      ];
    }

    case QUERY_TOKEN_KEYS.OPERATOR_GROUP: {
      if (lastToken.value === OPERATOR_GROUP.OPEN) {
        return (
          // fields
          (await options.suggestions.field()).map(element =>
            mapSuggestionCreatorField(element),
          )
        );
      } else if (lastToken.value === OPERATOR_GROUP.CLOSE) {
        return (
          // conjunction
          Object.keys(language.tokens.conjunction.literal).map(conjunction => ({
            type: QUERY_TOKEN_KEYS.CONJUNCTION,
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
 * Transform the UQL (Unified Query Language) to QL
 * @param input
 * @returns
 */
export function transformUQLToQL(input: string) {
  const tokens = tokenizerUQL(input);

  return tokens
    .filter(({ value }) => value)
    .map(({ type, value }) => {
      switch (type) {
        case QUERY_TOKEN_KEYS.CONJUNCTION: {
          return transformQLConjunction(value);
        }

        case QUERY_TOKEN_KEYS.VALUE: {
          return transformQLValue(value);
        }

        default: {
          return value;
        }
      }
    })
    .join('');
}

export function shouldUseSearchTerm(tokens: TokenList): boolean {
  return !(
    tokens.some(
      ({ type, value }) => type === QUERY_TOKEN_KEYS.OPERATOR_COMPARE && value,
    ) &&
    tokens.some(({ type, value }) => type === QUERY_TOKEN_KEYS.FIELD && value)
  );
}

export function transformToSearchTerm(
  searchTermFields: string[],
  input: string,
): string {
  return searchTermFields
    .map(searchTermField => `${searchTermField}~${input}`)
    .join(',');
}

/**
 * Transform the input in QL to UQL (Unified Query Language)
 * @param input
 * @returns
 */
export function transformSpecificQLToUnifiedQL(
  input: string,
  searchTermFields: string[],
) {
  const tokens = tokenizer(input);

  if (input && searchTermFields && shouldUseSearchTerm(tokens)) {
    return transformToSearchTerm(searchTermFields, input);
  }

  return tokens
    .filter(
      ({ type, value, formattedValue }) =>
        type !== QUERY_TOKEN_KEYS.WHITESPACE && (formattedValue ?? value),
    )
    .map(({ type, value, formattedValue }) => {
      switch (type) {
        case QUERY_TOKEN_KEYS.VALUE: {
          // If the value is wrapped with ", then replace the escaped double quotation mark (\")
          // by double quotation marks (")
          // WARN: This could cause a problem with value that contains this sequence \"
          const extractedValue =
            formattedValue === value
              ? formattedValue
              : formattedValue?.replaceAll(String.raw`\"`, '"');

          return extractedValue || value;
        }

        case QUERY_TOKEN_KEYS.CONJUNCTION: {
          return value === CONJUNCTION_WQL.AND
            ? language.equivalencesToUQL.conjunction.literal['and']
            : language.equivalencesToUQL.conjunction.literal['or'];
        }

        default: {
          return value;
        }
      }
    })
    .join('');
}

/**
 * Get the output from the input
 * @param input
 * @returns
 */
function getOutput(input: string, options: OptionsQL) {
  // Implicit query
  const implicitQueryAsUQL = options?.options?.implicitQuery?.query ?? '';
  const implicitQueryAsQL = transformUQLToQL(implicitQueryAsUQL);
  // Implicit query conjunction
  const implicitQueryConjunctionAsUQL =
    options?.options?.implicitQuery?.conjunction ?? '';
  const implicitQueryConjunctionAsQL = transformUQLToQL(
    implicitQueryConjunctionAsUQL,
  );
  // User input query
  const inputQueryAsQL = input;
  const inputQueryAsUQL = transformSpecificQLToUnifiedQL(
    inputQueryAsQL,
    options?.options?.searchTermFields ?? [],
  );

  return {
    language: WQL_ID,
    apiQuery: {
      q: [
        implicitQueryAsUQL,
        implicitQueryAsUQL && inputQueryAsUQL
          ? implicitQueryConjunctionAsUQL
          : '',
        implicitQueryAsUQL && inputQueryAsUQL
          ? `(${inputQueryAsUQL})`
          : inputQueryAsUQL,
      ].join(''),
    },
    query: [
      implicitQueryAsQL,
      implicitQueryAsQL && inputQueryAsQL ? implicitQueryConjunctionAsQL : '',
      implicitQueryAsQL && inputQueryAsQL
        ? `(${inputQueryAsQL})`
        : inputQueryAsQL,
    ].join(''),
  };
}

/**
 * Validate the token value
 * @param token
 * @returns
 */
function validateTokenValue(token: TokenDescriptor): string | undefined {
  const re = getTokenValueRegularExpression();
  const value = token.formattedValue ?? token.value;
  const match = value.match(re);

  if (match?.groups?.value === value) {
    return undefined;
  }

  const invalidCharacters: string[] = [...token.value]
    .filter((value, index, array) => array.indexOf(value) === index)
    .filter(
      character =>
        !new RegExp(String.raw`[\[\]\w _\-.,:?\\/'"=@%<>{}\(\)]`).test(
          character,
        ),
    );

  return [
    `"${value}" is not a valid value.`,
    ...(invalidCharacters.length > 0
      ? [`Invalid characters found: ${invalidCharacters.join('')}`]
      : []),
  ].join(' ');
}

type ITokenValidator = (
  tokenValue: TokenDescriptor,
  proximityTokens: any,
) => string | undefined;

/**
 * Validate the tokens while the user is building the query
 * @param tokens
 * @param validate
 * @returns
 */
function validatePartial(
  tokens: TokenList,
  validate: { field: ITokenValidator; value: ITokenValidator },
): undefined | string {
  // Ensure is not in search term mode
  if (!shouldUseSearchTerm(tokens)) {
    return (
      tokens
        .map((token: TokenDescriptor, index) => {
          if (token.value) {
            if (token.type === QUERY_TOKEN_KEYS.FIELD) {
              // Ensure there is a operator next to field to check if the fields is valid or not.
              // This allows the user can type the field token and get the suggestions for the field.
              const tokenOperatorNearToField = getTokenNearTo(
                tokens,
                QUERY_TOKEN_KEYS.OPERATOR_COMPARE,
                MODE.NEXT,
                {
                  tokenReferencePosition: index,
                  tokenFoundShouldHaveValue: true,
                },
              );

              return tokenOperatorNearToField
                ? validate.field(token)
                : undefined;
            }

            // Check if the value is allowed
            if (token.type === QUERY_TOKEN_KEYS.VALUE) {
              const tokenFieldNearToValue = getTokenNearTo(
                tokens,
                QUERY_TOKEN_KEYS.FIELD,
                MODE.PREVIOUS,
                {
                  tokenReferencePosition: index,
                  tokenFoundShouldHaveValue: true,
                },
              );
              const tokenOperatorCompareNearToValue = getTokenNearTo(
                tokens,
                QUERY_TOKEN_KEYS.OPERATOR_COMPARE,
                MODE.PREVIOUS,
                {
                  tokenReferencePosition: index,
                  tokenFoundShouldHaveValue: true,
                },
              );

              return (
                validateTokenValue(token) ||
                (tokenFieldNearToValue &&
                tokenOperatorCompareNearToValue &&
                validate.value
                  ? validate.value(token, {
                      field: tokenFieldNearToValue?.value,
                      operator: tokenOperatorCompareNearToValue?.value,
                    })
                  : undefined)
              );
            }
          }
        })
        .filter(t => t !== undefined)
        .join('\n') || undefined
    );
  }
}

/**
 * Validate the tokens if they are a valid syntax
 * @param tokens
 * @param validate
 * @returns
 */
function validate(
  tokens: TokenList,
  validate: { field: ITokenValidator; value: ITokenValidator },
): undefined | string[] {
  if (!shouldUseSearchTerm(tokens)) {
    const errors = tokens
      .map((token: TokenDescriptor, index) => {
        const errors = [];

        if (token.value) {
          if (token.type === QUERY_TOKEN_KEYS.FIELD) {
            const tokenOperatorNearToField = getTokenNearTo(
              tokens,
              QUERY_TOKEN_KEYS.OPERATOR_COMPARE,
              MODE.NEXT,
              {
                tokenReferencePosition: index,
                tokenFoundShouldHaveValue: true,
              },
            );
            const tokenValueNearToField = getTokenNearTo(
              tokens,
              QUERY_TOKEN_KEYS.VALUE,
              MODE.NEXT,
              {
                tokenReferencePosition: index,
                tokenFoundShouldHaveValue: true,
              },
            );

            if (validate.field(token)) {
              errors.push(`"${token.value}" is not a valid field.`);
            } else if (!tokenOperatorNearToField) {
              errors.push(
                `The operator for field "${token.value}" is missing.`,
              );
            } else if (!tokenValueNearToField) {
              errors.push(`The value for field "${token.value}" is missing.`);
            }
          }

          // Check if the value is allowed
          if (token.type === QUERY_TOKEN_KEYS.VALUE) {
            const tokenFieldNearToValue = getTokenNearTo(
              tokens,
              QUERY_TOKEN_KEYS.FIELD,
              MODE.PREVIOUS,
              {
                tokenReferencePosition: index,
                tokenFoundShouldHaveValue: true,
              },
            );
            const tokenOperatorCompareNearToValue = getTokenNearTo(
              tokens,
              QUERY_TOKEN_KEYS.OPERATOR_COMPARE,
              MODE.PREVIOUS,
              {
                tokenReferencePosition: index,
                tokenFoundShouldHaveValue: true,
              },
            );
            const validationError =
              validateTokenValue(token) ||
              (tokenFieldNearToValue &&
              tokenOperatorCompareNearToValue &&
              validate.value
                ? validate.value(token, {
                    field: tokenFieldNearToValue?.value,
                    operator: tokenOperatorCompareNearToValue?.value,
                  })
                : undefined);

            if (validationError) {
              errors.push(validationError);
            }
          }

          // Check if the value is allowed
          if (token.type === QUERY_TOKEN_KEYS.CONJUNCTION) {
            const tokenWhitespaceNearToFieldNext = getTokenNearTo(
              tokens,
              QUERY_TOKEN_KEYS.WHITESPACE,
              MODE.NEXT,
              { tokenReferencePosition: index },
            );
            const tokenFieldNearToFieldNext = getTokenNearTo(
              tokens,
              QUERY_TOKEN_KEYS.FIELD,
              MODE.NEXT,
              {
                tokenReferencePosition: index,
                tokenFoundShouldHaveValue: true,
              },
            );

            if (!tokenWhitespaceNearToFieldNext?.value?.length) {
              errors.push(
                `There is no whitespace after conjunction "${token.value}".`,
              );
            }

            if (!tokenFieldNearToFieldNext?.value?.length) {
              errors.push(
                `There is no sentence after conjunction "${token.value}".`,
              );
            }
          }
        }

        return errors.length > 0 ? errors : undefined;
      })
      .filter(Boolean)
      .flat();

    return errors.length > 0 ? errors : undefined;
  }

  return undefined;
}

export const WQL = {
  id: WQL_ID,
  label: 'WQL',
  description:
    'WQL (Wazuh Query Language) provides a human query syntax based on the Wazuh API query language.',
  documentationLink: webDocumentationLink(
    'user-manual/wazuh-dashboard/queries.html',
  ),
  getConfiguration() {
    return {
      isOpenPopoverImplicitFilter: false,
    };
  },
  async run(input, params) {
    // Get the tokens from the input
    const tokens: TokenList = tokenizer(input);
    // Get the implicit query as query language syntax
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const implicitQueryAsQL = params.queryLanguage.parameters?.options
      ?.implicitQuery
      ? transformUQLToQL(
          params.queryLanguage.parameters.options.implicitQuery.query +
            params.queryLanguage.parameters.options.implicitQuery.conjunction,
        )
      : '';
    const fieldsSuggestion: string[] =
      await params.queryLanguage.parameters.suggestions
        .field()
        .map(({ label }) => label);
    const validators = {
      field: ({ value }) =>
        fieldsSuggestion.includes(value)
          ? undefined
          : `"${value}" is not valid field.`,
      ...(params.queryLanguage.parameters?.validate?.value
        ? {
            value: params.queryLanguage.parameters?.validate?.value,
          }
        : {}),
    };
    // Validate the user input
    const validationPartial = validatePartial(tokens, validators);
    const validationStrict = validate(tokens, validators);
    // Get the output of query language
    const output = {
      ...getOutput(input, params.queryLanguage.parameters),
      error: validationStrict,
    };

    const onSearch = output => {
      if (output?.error) {
        params.setQueryLanguageOutput(state => ({
          ...state,
          searchBarProps: {
            ...state.searchBarProps,
            suggestions: transformSuggestionsToEuiSuggestItem(
              output.error.map(error => ({
                type: QUERY_TOKEN_KEYS.VALIDATION_ERROR,
                label: 'Invalid',
                description: error,
              })),
            ),
            isInvalid: true,
          },
        }));
      } else {
        params.onSearch(output);
      }
    };

    return {
      filterButtons: params.queryLanguage.parameters?.options?.filterButtons ? (
        <EuiButtonGroup
          legend='Search bar button filters'
          name='textAlign'
          buttonSize='m'
          options={params.queryLanguage.parameters?.options?.filterButtons.map(
            ({ id, label }) => ({ id, label }),
          )}
          idToSelectedMap={{}}
          type='multi'
          onChange={(id: string) => {
            const buttonParams =
              params.queryLanguage.parameters?.options?.filterButtons.find(
                ({ id: buttonID }) => buttonID === id,
              );

            if (buttonParams) {
              params.setInput(buttonParams.input);

              const output = {
                ...getOutput(
                  buttonParams.input,
                  params.queryLanguage.parameters,
                ),
                error: undefined,
              };

              params.onSearch(output);
            }
          }}
        />
      ) : null,
      searchBarProps: {
        // Props that will be used by the EuiSuggest component
        // Suggestions
        suggestions: transformSuggestionsToEuiSuggestItem(
          validationPartial
            ? [
                {
                  type: QUERY_TOKEN_KEYS.VALIDATION_ERROR,
                  label: 'Invalid',
                  description: validationPartial,
                },
              ]
            : await getSuggestions(tokens, params.queryLanguage.parameters),
        ),
        // Handler to manage when clicking in a suggestion item
        onItemClick: currentInput => item => {
          // There is an error, clicking on the item does nothing
          if (item.type.iconType === ICON_TYPE.ALERT) {
            return;
          }

          // When the clicked item has the `search` iconType, run the `onSearch` function
          if (item.type.iconType === ICON_TYPE.SEARCH) {
            // Execute the search action
            // Get the tokens from the input
            const tokens: TokenList = tokenizer(currentInput);
            const validationStrict = validate(tokens, validators);
            // Get the output of query language
            const output = {
              ...getOutput(currentInput, params.queryLanguage.parameters),
              error: validationStrict,
            };

            onSearch(output);
          } else {
            // When the clicked item has another iconType
            const lastToken: TokenDescriptor | undefined =
              getLastTokenDefined(tokens);

            // if the clicked suggestion is of same type of last token
            if (
              lastToken &&
              SUGGESTION_MAPPING_LANGUAGE_TOKEN_TYPE[lastToken.type]
                .iconType === item.type.iconType
            ) {
              // replace the value of last token with the current one.
              // if the current token is a value, then transform it
              lastToken.value =
                item.type.iconType ===
                SUGGESTION_MAPPING_LANGUAGE_TOKEN_TYPE.value.iconType
                  ? transformQLValue(item.label)
                  : item.label;
            } else {
              // add a whitespace for conjunction <whitespace><conjunction>
              // add a whitespace for grouping operator <whitespace>)
              if (
                !/\s$/.test(input) &&
                (item.type.iconType ===
                  SUGGESTION_MAPPING_LANGUAGE_TOKEN_TYPE.conjunction.iconType ||
                  lastToken?.type === QUERY_TOKEN_KEYS.CONJUNCTION ||
                  (item.type.iconType ===
                    SUGGESTION_MAPPING_LANGUAGE_TOKEN_TYPE.operator_group
                      .iconType &&
                    item.label === OPERATOR_GROUP.CLOSE))
              ) {
                tokens.push({
                  type: QUERY_TOKEN_KEYS.WHITESPACE,
                  value: ' ',
                });
              }

              // add a new token of the selected type and value
              tokens.push({
                type: Object.entries(
                  SUGGESTION_MAPPING_LANGUAGE_TOKEN_TYPE,
                ).find(
                  ([, { iconType }]) => iconType === item.type.iconType,
                )[0],
                value:
                  item.type.iconType ===
                  SUGGESTION_MAPPING_LANGUAGE_TOKEN_TYPE.value.iconType
                    ? transformQLValue(item.label)
                    : item.label,
              });

              // add a whitespace for conjunction <conjunction><whitespace>
              if (
                item.type.iconType ===
                SUGGESTION_MAPPING_LANGUAGE_TOKEN_TYPE.conjunction.iconType
              ) {
                tokens.push({
                  type: QUERY_TOKEN_KEYS.WHITESPACE,
                  value: ' ',
                });
              }
            }

            // Change the input
            params.setInput(
              tokens
                .filter(Boolean) // Ensure the input is rebuilt using tokens with value.
                // The input tokenization can contain tokens with no value due to the used
                // regular expression.
                .map(({ value }) => value)
                .join(''),
            );
          }
        },
        // Disable the focus trap in the EuiInputPopover.
        // This causes when using the Search suggestion, the suggestion popover can be closed.
        // If this is disabled, then the suggestion popover is open after a short time for this
        // use case.
        disableFocusTrap: true,
        // Show the input is invalid
        isInvalid: Boolean(validationStrict),
        // Define the handler when the a key is pressed while the input is focused
        onKeyPress: event => {
          if (event.key === 'Enter') {
            // Get the tokens from the input
            const input = event.currentTarget.value;
            const tokens: TokenList = tokenizer(input);
            const validationStrict = validate(tokens, validators);
            // Get the output of query language
            const output = {
              ...getOutput(input, params.queryLanguage.parameters),
              error: validationStrict,
            };

            onSearch(output);
          }
        },
      },
      output,
    };
  },
  transformInput: (unifiedQuery: string, { parameters }) => {
    const input =
      unifiedQuery && parameters?.options?.implicitQuery
        ? unifiedQuery.replace(
            new RegExp(
              `^${parameters.options.implicitQuery.query}${parameters.options.implicitQuery.conjunction}`,
            ),
            '',
          )
        : unifiedQuery;

    return transformUQLToQL(input);
  },
};
