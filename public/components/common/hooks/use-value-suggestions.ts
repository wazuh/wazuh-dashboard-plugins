import { useState, useEffect } from 'react';
import { getDataPlugin } from '../../../kibana-services';
import { useIndexPattern } from '.';
import { IFieldType, IIndexPattern } from 'src/plugins/data/public';
import React from 'react'


export interface IValueSuggestiions {
  filterOptions: string[] | boolean[];
  isLoading: boolean;
  setQuery: React.Dispatch<React.SetStateAction<string>>
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
      const field = {
        type: type,
        name: filterField,
        aggregatable: true,
      } as IFieldType;
      data.autocomplete
        .getValueSuggestions({
          query,
          indexPattern: indexPattern as IIndexPattern,
          field,
        })
        .then((result) => {
          setFilterOptions(result);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [indexPattern, query, filterField, type]);

  return { filterOptions, isLoading, setQuery };
};
