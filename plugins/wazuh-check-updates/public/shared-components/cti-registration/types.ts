import { statusCodes } from '../../../common/constants';
import { ISubscriptionResponse } from '../../services/types';

export interface LinkCtiProps {
  handleModalToggle: () => void;
  handleStatusModalToggle?: () => void;
}

export enum CtiStatus {
  AVAILABLE = 'available',
  PENDING = 'pending',
  DENIED = 'denied',
  POLLING = 'polling',
  ERROR = 'error',
}

export enum CtiDetails {
  ERROR = 'Error trying to contact the API',
  PENDING = 'Registration process was not started and never tried.',
}

export interface StatusCtiRegistrationProps {
  statusCTI: ISubscriptionResponse;
  checkCtiStatus: () => Promise<void>;
}

export interface StatusCtiModalProps {
  handleStatusModalToggle: () => void;
  checkCtiStatus: () => Promise<void>;
}
