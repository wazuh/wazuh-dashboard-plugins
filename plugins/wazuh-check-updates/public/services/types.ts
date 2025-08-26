import { CtiStatus } from '../shared-components/cti-registration/types';

export interface apiInfo {
  affected_items: Array<{
    registration: {
      status: CtiStatus;
    };
  }>;
}
