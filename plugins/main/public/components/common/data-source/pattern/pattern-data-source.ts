import { tDataSource, tSearchParams, tFilter } from "../index";
import { getDataPlugin } from '../../../../kibana-services';
import { Filter, IndexPatternsContract, OpenSearchQuerySortValue } from "../../../../../../../src/plugins/data/public";


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
        const data = getDataPlugin();
        const searchSource = await data.search.searchSource.create();
        const fromField = (pagination?.pageIndex || 0) * (pagination?.pageSize || 100);
        const sortOrder: OpenSearchQuerySortValue[] = sorting?.columns.map((column) => {
            const sortDirection = column.direction === 'asc' ? 'asc' : 'desc';
            return { [column?.id || '']: sortDirection } as OpenSearchQuerySortValue;
        }) || [];
        let filters = defaultFilters;
    
        // check if dateRange is defined
        if(params.dateRange && params.dateRange?.from && params.dateRange?.to){
            const { from, to } = params.dateRange;
            filters = [
                ...filters,
                {
                    range: {
                        [indexPattern.timeFieldName || 'timestamp']: {
                            gte: from,
                            lte: to,
                            format: 'strict_date_optional_time'
                        }
                    }
                }
            ]
        }
    
        const searchParams = searchSource
            .setParent(undefined)
            .setField('filter', filters)
            .setField('query', query)
            .setField('sort', sortOrder)
            .setField('size', pagination?.pageSize)
            .setField('from', fromField)
            .setField('index', indexPattern)
    
        // add fields
        if (fields && Array.isArray(fields) && fields.length > 0){
            searchParams.setField('fields', fields);
        }
        try{
            return await searchParams.fetch();
        }catch(error){
            if(error.body){
                throw error.body;
            }
            throw error;
        }
    }

}