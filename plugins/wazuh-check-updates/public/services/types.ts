import { CtiStatus } from '../shared-components/cti-subscription/types';

export interface apiInfo {
  affected_items: Array<{
    subscription: {
      status: CtiStatus;
    };
  }>;
}
