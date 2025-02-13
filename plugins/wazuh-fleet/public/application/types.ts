export interface AppSetup {
  registerApp: (app: any) => void;
  enrollmentAgentManagement: {
    getServerAddress: () => Promise<string>;
    setServerAddress: (url: string) => Promise<string>;
  };
}
