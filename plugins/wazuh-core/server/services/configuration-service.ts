import { CoreSetup, PluginInitializerContext } from "opensearch-dashboards/server";
import { Logger } from "opensearch-dashboards/server";
import { CorePluginConfigType } from "..";
import { first } from "rxjs/operators";
import { uiSettings } from "../ui_settings";

export class ConfigurationService {
    uiSettings: any;
    config: CorePluginConfigType = {
        hosts: {},
        pattern: '',
        vulnerabilityPattern: ''
    } 
    constructor(core: CoreSetup, private initializerContext: PluginInitializerContext){
        this.uiSettings = core.uiSettings;
    }

    async get(configName: any) {
        const config$ = await this.initializerContext.config.create<CorePluginConfigType>();
        this.config = await config$.pipe(first()).toPromise();
        
        if (this.config.hasOwnProperty(configName)) {
            return this.config[configName];
        }

        if (this.uiSettings.get(configName)) {
            return this.uiSettings.get(configName);
        }

        throw new Error(`Configuration ${configName} not found`);
    }

    private getAllUiSettings(){
        // loop through all the ui settings and return them
        let settings: { [key: string]: any } = {};
        for (let key in this.config) {
            settings[key] = this.uiSettings.get(key);
        }
        return settings;
    }

    async getAll() {
        const config$ = await this.initializerContext.config.create<CorePluginConfigType>();
        this.config = await config$.pipe(first()).toPromise();
        return {
            ...this.config,
            ...this.getAllUiSettings()
        }
    }

}