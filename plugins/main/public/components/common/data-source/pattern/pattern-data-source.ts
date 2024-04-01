import { tDataSource } from "../data-source";
import { getDataPlugin } from '../../../../kibana-services';


export class PatternDataSource implements tDataSource { 
    id: string;
    title: string;
    constructor(id: string, title: string) {
        this.id = id;
        this.title = title;
    }

    async select(){
        try {
            const pattern = await getDataPlugin().indexPatterns.get(this.id);
            if(pattern){
                const fields = await getDataPlugin().indexPatterns.getFieldsForIndexPattern(
                    pattern,
                  );
                const scripted = pattern.getScriptedFields().map(field => field.spec);
                pattern.fields.replaceAll([...fields, ...scripted]);
                await getDataPlugin().indexPatterns.updateSavedObject(pattern);
            }else{
                throw new Error('Error selecting index pattern: pattern not found');
            }
        }catch(error){
            throw new Error(`Error selecting index pattern: ${error}`);
        }
    }
}