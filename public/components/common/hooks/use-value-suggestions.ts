import { useState, useEffect } from 'react';
import { getDataPlugin } from '../../../kibana-services';
import { useIndexPattern } from '.';
import { IFieldType, IIndexPattern } from 'src/plugins/data/public';
import React from 'react';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import { UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';

export interface IValueSuggestiions {
  filterOptions: string[] | boolean[];
  isLoading: boolean;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
}

export const useValueSuggestions = (filterField: string, type: 'string' | 'boolean' = 'string') => {
  const [filterOptions, setFilterOptions] = useState<string[] | boolean[]>([]);
  const [query, setQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const data = getDataPlugin();
  const indexPattern = useIndexPattern();

  useEffect(() => {
    if (indexPattern) {
      setIsLoading(true);
      (async () => {
        const field = {
          type: type,
          name: filterField,
          aggregatable: true,
        } as IFieldType;
        try {
          setFilterOptions(
            await data.autocomplete.getValueSuggestions({
              query,
              indexPattern: indexPattern as IIndexPattern,
              field,
            })
          );
        } catch (error) {
          const options: UIErrorLog = {
            context: `${useValueSuggestions.name}.valueSuggestions`,
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
    }
  }, [indexPattern, query, filterField, type]);

  return { filterOptions, isLoading, setQuery };
};
