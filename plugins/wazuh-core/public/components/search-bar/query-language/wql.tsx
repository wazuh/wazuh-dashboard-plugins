/* eslint-disable unicorn/no-await-expression-member */
import React from 'react';
import { EuiButtonGroup } from '@elastic/eui';
import { SEARCH_BAR_WQL_VALUE_SUGGESTIONS_DISPLAY_COUNT } from '../../../../common/constants';
import { webDocumentationLink } from '../../../../common/services/web_documentation';
import { tokenizer as tokenizerUQL } from './aql';

/* UI Query language
https://documentation.wazuh.com/current/user-manual/api/queries.html

// Example of another query language definition
*/

const WQL_ID = 'wql';

type ITokenType =
  | 'field'
  | 'operator_compare'
  | 'operator_group'
  | 'value'
  | 'conjunction'
  | 'whitespace';
interface IToken {
  type: ITokenType;
  value: string;
  formattedValue?: string;
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
<operator_group>?<whitespace>?<field>?<whitespace>?<operator_compare>?<whitespace>?<value>?<whitespace>?<operator_conjunction>?<whitespace>?<operator_group>?<whitespace>?
*/

// Language definition
const language = {
  // Tokens
  tokens: {
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
        and: 'and',
        or: 'or',
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
  equivalencesToUQL: {
    conjunction: {
      literal: {
        and: ';',
        or: ',',
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
  // eslint-disable-next-line camelcase
  validation_error: { iconType: 'alert', color: 'tint2' },
};

/**
 * Creator of intermediate interface of EuiSuggestItem
 * @param type
 * @returns
 */
function mapSuggestionCreator(type: ITokenType) {
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

const mapSuggestionCreatorField = mapSuggestionCreator('field');
const mapSuggestionCreatorValue = mapSuggestionCreator('value');

/**
 * Transform the conjunction to the query language syntax
 * @param conjunction
 * @returns
 */
function transformQLConjunction(conjunction: string): string {
  // If the value has a whitespace or comma, then
  return conjunction === language.equivalencesToUQL.conjunction.literal['and']
    ? ` ${language.tokens.conjunction.literal['and']} `
    : ` ${language.tokens.conjunction.literal['or']} `;
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
export function tokenizer(input: string): ITokens {
  const re = new RegExp(
    // A ( character.
    String.raw`(?<operator_group_open>\()?` +
      // Whitespace
      String.raw`(?<whitespace_1>\s+)?` +
      // Field name: name of the field to look on DB.
      String.raw`(?<field>[\w.]+)?` + // Added an optional find
      // Whitespace
      String.raw`(?<whitespace_2>\s+)?` +
      // Operator: looks for '=', '!=', '<', '>' or '~'.
      // This seems to be a bug because is not searching the literal valid operators.
      // I guess the operator is validated after the regular expression matches
      `(?<operator_compare>[${Object.keys(
        language.tokens.operator_compare.literal,
      )}]{1,2})?` + // Added an optional find
      // Whitespace
      String.raw`(?<whitespace_3>\s+)?` +
      // Value: A string.
      // Simple value
      // Quoted ", "value, "value", "escaped \"quote"
      // Escape quoted string with escaping quotes: https://stackoverflow.com/questions/249791/regex-for-quoted-string-with-escaping-quotes
      String.raw`(?<value>(?:(?:[^"\s]+|(?:"(?:[^"\\]|\\")*")|(?:"(?:[^"\\]|\\")*)|")))?` +
      // Whitespace
      String.raw`(?<whitespace_4>\s+)?` +
      // A ) character.
      String.raw`(?<operator_group_close>\))?` +
      // Whitespace
      String.raw`(?<whitespace_5>\s+)?` +
      `(?<conjunction>${Object.keys(language.tokens.conjunction.literal).join(
        '|',
      )})?` +
      // Whitespace
      String.raw`(?<whitespace_6>\s+)?`,
    'g',
  );

  return [...input.matchAll(re)].flatMap(({ groups }) =>
    Object.entries(groups).map(([key, value]) => ({
      type: key.startsWith('operator_group') // Transform operator_group group match
        ? 'operator_group'
        : key.startsWith('whitespace') // Transform whitespace group match
          ? 'whitespace'
          : key,
      value,
      ...(key === 'value' &&
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
  type:
    | 'operator_group'
    | 'field'
    | 'operator_compare'
    | 'value'
    | 'conjunction'
    | 'function_search';
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
        token: IToken,
        nearTokens: { field: string; operator: string },
      ) => string | undefined
    >;
  };
}

export interface ISearchBarModeWQL extends OptionsQL {
  id: 'wql';
}

/**
 * Get the last token with value
 * @param tokens Tokens
 * @param tokenType token type to search
 * @returns
 */
function getLastTokenDefined(tokens: ITokens): IToken | undefined {
  // Reverse the tokens array and use the Array.protorype.find method
  const shallowCopyArray = [...tokens];
  const shallowCopyArrayReversed = shallowCopyArray.reverse();
  const tokenFound = shallowCopyArrayReversed.find(
    ({ type, value }) => type !== 'whitespace' && value,
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
 * Get the token that is near to a token position of the token type.
 * @param tokens
 * @param tokenReferencePosition
 * @param tokenType
 * @param mode
 * @returns
 */
function getTokenNearTo(
  tokens: ITokens,
  tokenType: ITokenType,
  mode: 'previous' | 'next' = 'previous',
  options: {
    tokenReferencePosition?: number;
    tokenFoundShouldHaveValue?: boolean;
  } = {},
): IToken | undefined {
  const shallowCopyTokens = [...tokens];
  const computedShallowCopyTokens =
    mode === 'previous'
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
    String.raw`^(?<value>(?:(?:\((?:\[[\[\]\w _\-.,:?\\/'"=@%<>{}]*]|[\[\]\w _\-.:?\/'"=@%<>{}]*)\))*` +
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
  tokens: ITokens,
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
        type: 'function_search',
        label: 'Search',
        description: 'run the search query',
      },
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
      const field = getLastTokenDefinedByType(tokens, 'field')?.value;
      const operatorCompare = getLastTokenDefinedByType(
        tokens,
        'operator_compare',
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
            type: 'operator_compare',
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

    case 'value': {
      const field = getLastTokenDefinedByType(tokens, 'field')?.value;
      const operatorCompare = getLastTokenDefinedByType(
        tokens,
        'operator_compare',
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
                type: 'function_search',
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
          ? (await options.suggestions.field()).map((element, index, array) =>
              mapSuggestionCreatorField(element, index, array),
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
        case 'conjunction': {
          return transformQLConjunction(value);
        }

        case 'value': {
          return transformQLValue(value);
        }

        default: {
          return value;
        }
      }
    })
    .join('');
}

export function shouldUseSearchTerm(tokens: ITokens): boolean {
  return !(
    tokens.some(({ type, value }) => type === 'operator_compare' && value) &&
    tokens.some(({ type, value }) => type === 'field' && value)
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
        type !== 'whitespace' && (formattedValue ?? value),
    )
    .map(({ type, value, formattedValue }) => {
      switch (type) {
        case 'value': {
          // If the value is wrapped with ", then replace the escaped double quotation mark (\")
          // by double quotation marks (")
          // WARN: This could cause a problem with value that contains this sequence \"
          const extractedValue =
            formattedValue === value
              ? formattedValue
              : formattedValue.replaceAll(String.raw`\"`, '"');

          return extractedValue || value;
        }

        case 'conjunction': {
          return value === 'and'
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
function validateTokenValue(token: IToken): string | undefined {
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
  tokenValue: IToken,
  proximityTokens: any,
) => string | undefined;

/**
 * Validate the tokens while the user is building the query
 * @param tokens
 * @param validate
 * @returns
 */
function validatePartial(
  tokens: ITokens,
  validate: { field: ITokenValidator; value: ITokenValidator },
): undefined | string {
  // Ensure is not in search term mode
  if (!shouldUseSearchTerm(tokens)) {
    return (
      tokens
        .map((token: IToken, index) => {
          if (token.value) {
            if (token.type === 'field') {
              // Ensure there is a operator next to field to check if the fields is valid or not.
              // This allows the user can type the field token and get the suggestions for the field.
              const tokenOperatorNearToField = getTokenNearTo(
                tokens,
                'operator_compare',
                'next',
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
            if (token.type === 'value') {
              const tokenFieldNearToValue = getTokenNearTo(
                tokens,
                'field',
                'previous',
                {
                  tokenReferencePosition: index,
                  tokenFoundShouldHaveValue: true,
                },
              );
              const tokenOperatorCompareNearToValue = getTokenNearTo(
                tokens,
                'operator_compare',
                'previous',
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
  tokens: ITokens,
  validate: { field: ITokenValidator; value: ITokenValidator },
): undefined | string[] {
  if (!shouldUseSearchTerm(tokens)) {
    const errors = tokens
      .map((token: IToken, index) => {
        const errors = [];

        if (token.value) {
          if (token.type === 'field') {
            const tokenOperatorNearToField = getTokenNearTo(
              tokens,
              'operator_compare',
              'next',
              {
                tokenReferencePosition: index,
                tokenFoundShouldHaveValue: true,
              },
            );
            const tokenValueNearToField = getTokenNearTo(
              tokens,
              'value',
              'next',
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
          if (token.type === 'value') {
            const tokenFieldNearToValue = getTokenNearTo(
              tokens,
              'field',
              'previous',
              {
                tokenReferencePosition: index,
                tokenFoundShouldHaveValue: true,
              },
            );
            const tokenOperatorCompareNearToValue = getTokenNearTo(
              tokens,
              'operator_compare',
              'previous',
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
          if (token.type === 'conjunction') {
            const tokenWhitespaceNearToFieldNext = getTokenNearTo(
              tokens,
              'whitespace',
              'next',
              { tokenReferencePosition: index },
            );
            const tokenFieldNearToFieldNext = getTokenNearTo(
              tokens,
              'field',
              'next',
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

// eslint-disable-next-line @typescript-eslint/naming-convention
export const WQL = {
  id: 'wql',
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
    const tokens: ITokens = tokenizer(input);
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
                type: 'validation_error',
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
                  type: 'validation_error',
                  label: 'Invalid',
                  description: validationPartial,
                },
              ]
            : await getSuggestions(tokens, params.queryLanguage.parameters),
        ),
        // Handler to manage when clicking in a suggestion item
        onItemClick: currentInput => item => {
          // There is an error, clicking on the item does nothing
          if (item.type.iconType === 'alert') {
            return;
          }

          // When the clicked item has the `search` iconType, run the `onSearch` function
          if (item.type.iconType === 'search') {
            // Execute the search action
            // Get the tokens from the input
            const tokens: ITokens = tokenizer(currentInput);
            const validationStrict = validate(tokens, validators);
            // Get the output of query language
            const output = {
              ...getOutput(currentInput, params.queryLanguage.parameters),
              error: validationStrict,
            };

            onSearch(output);
          } else {
            // When the clicked item has another iconType
            const lastToken: IToken | undefined = getLastTokenDefined(tokens);

            // if the clicked suggestion is of same type of last token
            if (
              lastToken &&
              suggestionMappingLanguageTokenType[lastToken.type].iconType ===
                item.type.iconType
            ) {
              // replace the value of last token with the current one.
              // if the current token is a value, then transform it
              lastToken.value =
                item.type.iconType ===
                suggestionMappingLanguageTokenType.value.iconType
                  ? transformQLValue(item.label)
                  : item.label;
            } else {
              // add a whitespace for conjunction <whitespace><conjunction>
              // add a whitespace for grouping operator <whitespace>)
              // eslint-disable-next-line @typescript-eslint/no-unused-expressions
              !/\s$/.test(input) &&
                (item.type.iconType ===
                  suggestionMappingLanguageTokenType.conjunction.iconType ||
                  lastToken?.type === 'conjunction' ||
                  (item.type.iconType ===
                    suggestionMappingLanguageTokenType.operator_group
                      .iconType &&
                    item.label === ')')) &&
                tokens.push({
                  type: 'whitespace',
                  value: ' ',
                });

              // add a new token of the selected type and value
              tokens.push({
                type: Object.entries(suggestionMappingLanguageTokenType).find(
                  ([, { iconType }]) => iconType === item.type.iconType,
                )[0],
                value:
                  item.type.iconType ===
                  suggestionMappingLanguageTokenType.value.iconType
                    ? transformQLValue(item.label)
                    : item.label,
              });

              // add a whitespace for conjunction <conjunction><whitespace>
              if (
                item.type.iconType ===
                suggestionMappingLanguageTokenType.conjunction.iconType
              ) {
                tokens.push({
                  type: 'whitespace',
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
            const tokens: ITokens = tokenizer(input);
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
