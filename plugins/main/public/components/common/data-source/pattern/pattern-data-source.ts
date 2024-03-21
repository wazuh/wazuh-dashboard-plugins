import { tDataSource, tSearchParams, tFilter } from "../index";
import { getDataPlugin } from '../../../../kibana-services';
import { Filter, IndexPatternsContract, OpenSearchQuerySortValue } from "../../../../../../../src/plugins/data/public";
import { search } from '../../search-bar/search-bar-service';

export class PatternDataSource implements tDataSource { 
    id: string;
    title: string;
    fields: any[];
    patternService: IndexPatternsContract;
    defaultFixedFilters: tFilter[];

    constructor(id: string, title: string) {
        this.id = id;
        this.title = title;
    }

    /**
     * Initialize the data source
     */
    async init(){
        this.patternService = await getDataPlugin().indexPatterns;
    }

    getFilters(){
        return [];
    }

    getFields(){
        return this.fields;
    }

    getFixedFilters():Filter[]{
        // return all filters
        return [];
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
            const results = await search(
                {
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


    getFetchFilters(){
        return [];
    }



}