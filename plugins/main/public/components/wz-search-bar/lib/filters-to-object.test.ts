import { filtersToObject, IFilter } from './filters-to-object';
import { CASES_SEARCHBAR_FILTER_OBJECT } from '../wz-search-bar.test-cases';

describe('Filters to Object', () => {
  describe('Cases defined in wz-search-bar.test-cases', () => {
    it.each(CASES_SEARCHBAR_FILTER_OBJECT)(
      'should parse inputs "%j" to valid object %j ',
      (inputs, expectQueryObject) => {
        const filters: IFilter[] = (inputs as string[]).map((input) => {
          return {
            field: 'q',
            value: input,
          };
        });

        const oFilters = filtersToObject(filters);
        expect(oFilters).toEqual(expectQueryObject);
      }
    );
  });
});
