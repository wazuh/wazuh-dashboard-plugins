export interface IApi {
  id: string;
  user: string;
  password: string;
  url: string;
  port: number;
  cluster_info: {
    manager: string;
    cluster: 'Disabled' | 'Enabled';
    status: 'disabled' | 'enabled';
  };
}
