/*
 * Wazuh app - React hook for getting value suggestions
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
import { getDataPlugin } from '../../../kibana-services';
import { IIndexPattern } from 'src/plugins/data/public';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { get, map } from 'lodash';

export interface IValueSuggestion {
  suggestedValues: string[] | boolean[];
  isLoading: boolean;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
}

export interface BoolFilter {
  field: string;
  value: string;
}

/**
 * Use the provided mechanism to retrieve the suggetions. It only supports the boolean and string
 * types.
 * @param param0
 * @returns
 */
async function getValueSuggestionResolverAutocomplete({
  query,
  indexPattern,
  field,
  boolFilter,
}) {
  return getDataPlugin().autocomplete.getValueSuggestions({
    query,
    indexPattern: indexPattern as IIndexPattern,
    field: { ...field, toSpec: () => field },
    boolFilter: boolFilter,
  });
}

/**
 * Custom mechanism to retrieve the suggestions for field, based on an aggregation using script
 * @param param0
 * @returns
 */
async function getValueSuggestionResolverAggregation({
  query,
  indexPattern,
  field,
  boolFilter,
}) {
  const searchSource = await getDataPlugin().search.searchSource.create();
  const searchParams = searchSource
    .setParent(undefined)
    .setField('size', 0) // no return hits
    .setField('index', indexPattern)
    .setField('aggs', {
      suggestions: {
        terms: {
          script: {
            lang: 'painless',
            source: `doc['${field.name}'].value.toString()`,
          },
          order: {
            _key: 'asc', // Lexically ascending order based on the string value
          },
          size: 10,
        },
      },
    });

  if (query) {
    const [boolFilterTermQuery] = boolFilter;

    searchParams.setField('query', {
      language: 'lucene',
      query: {
        script: {
          /* Performance: Script queries can be slower than native queries, especially on large
            datasets. If the substring search is a common operation, consider enhancing your field
            mapping or using an ingest pipeline to prepare a searchable version of the IP. */
          script: {
            lang: 'painless',
            /* TODO: add the boolFilter for drilldown views such as Office365 or GitHub. This is not
            required at this time, but it should be enhanced for the commented use case.
            */
            source: `doc['${field.name}'].value.toString().contains(params.searchQuery)`,
            params: {
              searchQuery: query,
            },
          },
        },
      },
    });
  }

  const response = await searchParams.fetch();
  const buckets = get(response, 'aggregations.suggestions.buckets');
  return map(buckets || [], 'key');
}

const getValueSuggestionResolversByFieldType = {
  string: getValueSuggestionResolverAutocomplete,
  boolean: getValueSuggestionResolverAutocomplete,
  _default: getValueSuggestionResolverAggregation,
};

const getValueSuggestionResolver = ({
  query,
  indexPattern,
  field,
  boolFilter,
}) => {
  const resolver =
    getValueSuggestionResolversByFieldType[field.type] ||
    getValueSuggestionResolversByFieldType._default;
  return resolver({ query, indexPattern, field, boolFilter });
};

export const useValueSuggestion = (
  filterField: string,
  boolFilterValue: BoolFilter = {
    field: '',
    value: '',
  },
  options?: string[],
  indexPattern?: IIndexPattern,
): IValueSuggestion => {
  const [suggestedValues, setSuggestedValues] = useState<string[] | boolean[]>(
    [],
  );
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const getOptions = (): string[] => {
    return (
      options?.filter(element =>
        element.toLowerCase().includes(query.toLowerCase()),
      ) || []
    );
  };

  const getValueSuggestions = async field => {
    const boolFilter =
      boolFilterValue.value !== ''
        ? [
            {
              term: {
                [boolFilterValue.field]: `${boolFilterValue.value}`,
              },
            },
          ]
        : []; /* FIX: This should create a query depending on the field type. This is using term
        and this could not be supported for other types */
    return options
      ? getOptions()
      : getValueSuggestionResolver({
          query,
          indexPattern: indexPattern as IIndexPattern,
          field: { ...field, toSpec: () => field },
          boolFilter: boolFilter,
        });
  };

  useEffect(() => {
    if (indexPattern) {
      setIsLoading(true);
      (async () => {
        try {
          const field = indexPattern.fields.find(
            ({ spec: { name } }) => name === filterField,
          );
          const suggestions = await getValueSuggestions(field.spec);
          setSuggestedValues(suggestions);
        } catch (error) {
          const options: UIErrorLog = {
            context: `${useValueSuggestion.name}.getValueSuggestions`,
            level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
            severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
            error: {
              error,
              message: error.message || error,
              title: error.name,
            },
          };
          getErrorOrchestrator().handleError(options);
        } finally {
          setIsLoading(false);
        }
      })();
    } else {
      setSuggestedValues([]);
      setIsLoading(false);
    }
  }, [indexPattern, query, filterField, boolFilterValue]);

  return { suggestedValues, isLoading, setQuery };
};
