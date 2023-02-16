import { AQL } from './aql';
import { UIQL } from './uiql';

type SearchBarQueryLanguage = {
  description: string;
  documentationLink?: string;
  id: string;
  label: string;
  getConfiguration?: () => any;
  run: (input: string | undefined, params: any) => any;
  transformUnifiedQuery: (unifiedQuery) => any;
};

// Register the query languages
export const searchBarQueryLanguages: {
  [key: string]: SearchBarQueryLanguage;
} = [AQL, UIQL].reduce((accum, item) => {
  if (accum[item.id]) {
    throw new Error(`Query language with id: ${item.id} already registered.`);
  }
  return {
    ...accum,
    [item.id]: item,
  };
  ['hola'];
}, {});
