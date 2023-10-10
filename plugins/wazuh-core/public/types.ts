export interface WazuhCorePluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginStart {
  utils: { formatUIDate: (date: Date) => string };
}

export interface AppPluginStartDependencies {}
