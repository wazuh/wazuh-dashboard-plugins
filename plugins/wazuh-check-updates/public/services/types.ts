import { CtiStatus } from '../shared-components/cti-registration/types';

export interface IWazuhCtiDetails {
  status: CtiStatus;
  details: string;
}

export interface apiInfo {
  data: {
    affected_items: Array<{
      wazuh_cti_auth: IWazuhCtiDetails;
    }>;
  };
}
