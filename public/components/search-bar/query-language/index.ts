import { AQL } from './aql';
import { HAQL } from './haql';

type SearchBarQueryLanguage = {
  description: string;
  documentationLink?: string;
  id: string;
  label: string;
  getConfiguration?: () => any;
  run: (input: string | undefined, params: any) => Promise<{
    searchBarProps: any,
    output: {
      language: string,
      unifiedQuery: string,
      query: string
    }
  }>;
  transformUnifiedQuery: (unifiedQuery: string) => string;
};

// Register the query languages
export const searchBarQueryLanguages: {
  [key: string]: SearchBarQueryLanguage;
} = [AQL, HAQL].reduce((accum, item) => {
  if (accum[item.id]) {
    throw new Error(`Query language with id: ${item.id} already registered.`);
  }
  return {
    ...accum,
    [item.id]: item,
  };
}, {});
