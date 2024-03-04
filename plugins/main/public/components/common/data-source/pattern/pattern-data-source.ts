import { tDataSource } from "./data-source";


/* Use case load DataSource index patterns 

- load index patterns service - indexPatternService from plugin

- load index patterns available 
    * await PatternHandler.getPatternList('api') : IndexPattern[]
        type indexPattern = {
            id: string;
            title: string
        }

    * receive the default patterns and validate 
        SavedObject.getListOfWazuhValidIndexPatterns(defaultPatterns, origin)
        SavedObject.getListOfWazuhValidIndexPatterns(IndePattern[]], 'api');

    * to validate request the saved_objects `/api/saved_objects/_find?type=index-pattern&fields=title&fields=fields&per_page=9999`  - find all type=index-pattern 
        type savedObjects = {
            attributes: {
                fields: "[{\"name\":\"_id\",\"type\":\"string\",\"esTypes\":[\"_id\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"_index\",\"type\":\"string\",\"esTypes\":[\"_index\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"_score\",\"type\":\"number\",\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"_source\",\"type\":\"_source\",\"esTypes\":[\"_source\"],\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"_type\",\"type\":\"string\",\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"cluster.name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"configSum\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"configSum.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"configSum\"}}},{\"name\":\"dateAdd\",\"type\":\"date\",\"esTypes\":[\"date\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"disconnection_time\",\"type\":\"date\",\"esTypes\":[\"date\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"group\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"group.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"group\"}}},{\"name\":\"group_config_status\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"group_config_status.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"group_config_status\"}}},{\"name\":\"host\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"id\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"ip\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"lastKeepAlive\",\"type\":\"date\",\"esTypes\":[\"date\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"manager\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"manager.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"manager\"}}},{\"name\":\"mergedSum\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"mergedSum.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"mergedSum\"}}},{\"name\":\"name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"node_name\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"node_name.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"node_name\"}}},{\"name\":\"os.arch\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.arch.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.arch\"}}},{\"name\":\"os.build\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.build.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.build\"}}},{\"name\":\"os.major\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.major.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.major\"}}},{\"name\":\"os.minor\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.minor.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.minor\"}}},{\"name\":\"os.name\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.name.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.name\"}}},{\"name\":\"os.platform\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.platform.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.platform\"}}},{\"name\":\"os.uname\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.uname.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.uname\"}}},{\"name\":\"os.version\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.version.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.version\"}}},{\"name\":\"registerIP\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"registerIP.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"registerIP\"}}},{\"name\":\"status\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"status_code\",\"type\":\"number\",\"esTypes\":[\"long\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"timestamp\",\"type\":\"date\",\"esTypes\":[\"date\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"version\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"version.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"version\"}}}]"
                title: "wazuh-monitoring-*"
            },
            id: 'wazuh-monitoring-*;
            migrationVersion: {
                index-pattern: '7.6.0'
            },
            namespace: ['default'],
            references: [],
            score: 0,
            type: "index-pattern"
            updated_at: "2024-01-09T16:37:31.020Z"
            version: "WzQsMV0="
        }

- get the fields from the indexPattern /api/saved_objects/index-pattern/${patternID}?fields=title&fields=fields.
(this adds the _fields into index patterns list)
- why validateIndexPattern its only check if the index have the following fields ?
this filter and remove the wazuh-monitoring and wazuh-statistics index pattern

static validateIndexPatterns(list) {
    const requiredFields = ['timestamp', 'rule.groups', 'manager.name', 'agent.id'];
    return list.filter(item => item && item._fields && requiredFields.every(reqField => item._fields.some(field => field.name === reqField)));
}
- validate comparing list of patterns and saved_objects requested

- ONLY RETURNS title and id


*/

// get the valid list of index patterns patternHandler.getPatternList('api'); the flag is to difference between api or health-check
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