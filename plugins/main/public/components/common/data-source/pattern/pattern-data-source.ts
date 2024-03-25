import { tDataSource, tSearchParams, tFilter, tParsedIndexPattern } from "../index";
import { getDataPlugin } from '../../../../kibana-services';
import { Filter, IndexPatternsContract, IndexPattern } from "../../../../../../../src/plugins/data/public";
import { search } from '../../search-bar/search-bar-service';
import store from '../../../../redux/store';
import { getFilterExcludeManager, getFilterAllowedAgents } from '../../../../react-services/data-sources/vulnerabilities-states';
import { DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT } from "../../../../../common/constants";


export class PatternDataSource implements tDataSource { 
    id: string;
    title: string;
    fields: any[];
    patternService: IndexPatternsContract;
    indexPattern: IndexPattern;
    defaultFixedFilters: tFilter[];
    filters: tFilter[];

    constructor(id: string, title: string) {
        this.id = id;
        this.title = title;
    }
    /**
     * Initialize the data source
     */
    async init(){
        this.patternService = await getDataPlugin().indexPatterns;
        this.indexPattern = await this.patternService.get(this.id);
    }

    getFields(){
        return this.fields;
    }

    setFilters(filters: Filter[]) {
        this.filters = filters;
    }


    getFilters(){
        return [
            ...this.getFixedFilters(),
            ...this.filters
        ];
    }

    getFixedFilters(): tFilter[]{
        // return all filters
        return [
            ...this.getPinnedAgentFilter(),
        ];
    }

    getFetchFilters(): tFilter[]{
        return [
            ...this.filters,
            ...this.getAllowAgentsFilter(),
            ...this.getExcludeManagerFilter()
        ];
    }

    async select(){
        try {
            const pattern = await this.patternService.get(this.id);
            if(pattern){
                const fields = await this.patternService.getFieldsForIndexPattern(
                    pattern,
                  );
                const scripted = pattern.getScriptedFields().map(field => field.spec);
                pattern.fields.replaceAll([...fields, ...scripted]);
                await this.patternService.updateSavedObject(pattern);
            }else{
                throw new Error('Error selecting index pattern: pattern not found');
            }
        }catch(error){
            throw new Error(`Error selecting index pattern: ${error}`);
        }
    }

    async fetch(params: tSearchParams){
        const indexPattern = await this.patternService.get(this.id);
        const { filters: defaultFilters = [], query, pagination, sorting, fields } = params;
        if(!indexPattern){
            return;
        }
    
        try {
            const results = await search({
                    indexPattern,
                    filters: defaultFilters,
                    query,
                    pagination,
                    sorting,
                    fields: fields
                }
            );

            return results;
        }catch(error){
            throw new Error(`Error fetching data: ${error}`);
        }
        
    }

    toJSON(): tParsedIndexPattern {
        return {
            attributes: {
                fields: JSON.stringify(this.fields),
                title: this.title
            },
            title: this.title,
            id: this.id,
            migrationVersion: {
                'index-pattern': '7.10.0'
            },
            namespace: [],
            references: [],
            score: 0,
            type: 'index-pattern',
            updated_at: new Date().toISOString(),
            version: 'WzPatternDataSource',
            _fields: this.fields
        }
    }

     /**
     * Returns the filter when the an agent is pinned (saved in the session storage or redux store)
     */
     getPinnedAgentFilter(): tFilter[] {
        const agentId = store.getState().appStateReducers?.currentAgentData?.id;
        if (!agentId) return [];
        return [{
          meta: {
            removable: false, // used to hide the close icon in the filter
            alias: null,
            disabled: false,
            key: 'agent.id',
            negate: false,
            params: { query: agentId },
            type: 'phrase',
            index: this.dataSource.id,
            controlledBy: DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT
          },
          query: {
            match: {
              'agent.id': {
                query: agentId,
                type: 'phrase',
              },
            },
          },
          $state: {
            store: 'appState' // check appStore is not assignable, why is stored here?
          },
        } as tFilter]
      }
    
      /**
       * Return the filter to exclude the data related to servers (managers) due to the setting hideManagerAlerts is enabled
       */
      getExcludeManagerFilter(): tFilter[] {
        return store.getState().appConfig?.data?.hideManagerAlerts ?
          [getFilterExcludeManager(this.dataSource.title) as tFilter] : [];
      }
    
      /**
       * Return the allowed agents related to the user permissions to read data from agents in the
        API server
       */
      getAllowAgentsFilter(): tFilter[] {
        const allowedAgents = store.getState().appStateReducers?.allowedAgents || [];
        return allowedAgents.lenght > 0 ?
          [getFilterAllowedAgents(allowedAgents, this.dataSource.title) as tFilter] : []
      }
    

}