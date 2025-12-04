import { statusCodes } from '../../common/constants';

export interface ISubscriptionResponse {
  status: statusCodes;
  message: string;
}
