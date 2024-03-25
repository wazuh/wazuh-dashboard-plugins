import { tDataSourceFilterManager, tFilter } from '../index';

export class PatternDataSourceFilterManager implements tDataSourceFilterManager {

    constructor(private dataSource: tDataSource, private filters: tFilter[] = []) {
      if (!dataSource) {
        throw new Error('Data source is required');
      }
      this.dataSource = dataSource;
      this.filters = filters.length ? this.filterUserFilters(filters) : [];
    }
  
    /**
     * Get the filters necessary to fetch the data from the data source
     * @returns 
     */
    fetch(params: Omit<tSearchParams, 'filters'> = {}): Promise<any> {
      return this.dataSource.fetch({
        ...params,
        filters: this.getFetchFilters(),
      });
    }
  
    setFilters(filters: tFilter[]) {
      this.filters = this.filterUserFilters(filters) || [];
    }
  
    /**
     * Filter the filters that was added by the user
     * The filters must not have:
     *  - the property isImplicit ($state.isImplicit) defined
     *  - the meta.controlledBy property defined
     *  - the meta.index is not the same as the dataSource.id
     * 
     */
    private filterUserFilters(filters: tFilter[]) {
      if (!filters) return [];
      return this.removeRepeatedFilters(filters.filter(
        filter => !(filter?.$state?.['isImplicit'] || filter.meta?.controlledBy || filter.meta?.index !== this.dataSource.id)
      ));
    }
  
    /**
     * Return the fixed filters. The fixed filters are filters that cannot be removed by the user.
     * The filters for the specific data source are defined in the data source.
     * Also, exists fixed filters that are defined in the data source filter manager (globally).
     * @returns 
     */
    getFixedFilters(): tFilter[] {
      const fixedFilters = this.dataSource.getFixedFilters();
  
      return [
        ...fixedFilters,
      ]
    }
  
    /**
     * Return the filters that was added by the user and the fixed filters.
     * This can be use to show the filters in the UI (For instance: SearchBar)
     * @returns 
     */
    getFilters() {
      return [
        ...this.getFixedFilters(),
        ...this.filters,
      ]
    }
  
    /**
     * Concatenate the filters to fetch the data from the data source
     * @returns 
     */
    getFetchFilters(): tFilter[] {
      return [
        ...this.dataSource.getFetchFilters()
      ] 
      
    }
  
    /**
     * Remove filter repeated filters in query property
     * @param filter 
     * @returns 
     */
    
    removeRepeatedFilters(filters: tFilter) {
      if (!filters) return filters;
      const query = filters.query;
      if (!query) return filters;
      const keys = Object.keys(query);
      if (keys.length === 1) {
        const key = keys[0];
        if (query[key].query) {
          query[key].query = Array.isArray(query[key].query) ? Array.from(new Set(query[key].query)) : query[key].query;
        }
      }
      return filters;
    }

  }