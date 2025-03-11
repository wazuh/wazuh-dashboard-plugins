export interface AppSetup {
  registerApp: (app: any) => void;
  enrollmentAgentManagement: {
    serverURLSettingName: string;
    getServerURL: () => Promise<string>;
    setServerURL: (url: string) => Promise<string>;
    commsURLSettingName: string;
    getCommunicationsURL: () => Promise<string>;
    setCommunicationsURL: (url: string) => Promise<string>;
  };
}
