// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCheckUpdatesPluginSetup { }
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCheckUpdatesPluginStart {
    getUpdate: (id: number) => Promise<any>
    getUpdateList: () => Promise<any>
}