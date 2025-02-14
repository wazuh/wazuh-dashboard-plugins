export interface AppSetup {
  registerApp: (app: any) => void;
  enrollmentAgentManagement: {
    serverAddresSettingName: string;
    getServerAddress: () => Promise<string>;
    setServerAddress: (url: string) => Promise<string>;
  };
}
