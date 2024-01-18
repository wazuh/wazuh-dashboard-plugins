export interface WazuhCorePluginSetup {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCorePluginStart {
  hooks: { useDockedSideNav: () => boolean };
  utils: { formatUIDate: (date: Date) => string };
}

export interface AppPluginStartDependencies {}
