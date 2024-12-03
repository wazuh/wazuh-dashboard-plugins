import { AQL } from './aql';
import { WQL } from './wql';

interface SearchBarQueryLanguage {
  description: string;
  documentationLink?: string;
  id: string;
  label: string;
  getConfiguration?: () => any;
  run: (
    input: string | undefined,
    params: any,
  ) => Promise<{
    searchBarProps: any;
    output: {
      language: string;
      unifiedQuery: string;
      query: string;
    };
  }>;
  transformInput: (
    unifiedQuery: string,
    options: { configuration: any; parameters: any },
  ) => string;
}

// Register the query languages
export const searchBarQueryLanguages: Record<string, SearchBarQueryLanguage> = [
  AQL,
  WQL,
  // eslint-disable-next-line unicorn/no-array-reduce
].reduce((accum, item) => {
  if (accum[item.id]) {
    throw new Error(`Query language with id: ${item.id} already registered.`);
  }

  return {
    ...accum,
    [item.id]: item,
  };
}, {});
