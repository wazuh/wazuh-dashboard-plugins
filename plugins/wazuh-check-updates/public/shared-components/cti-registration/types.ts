import { ISubscriptionResponse } from '../../services/types';

/** OAuth device authorization fields shown after starting CTI registration. */
export type CtiDeviceAuthorization = {
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
};

export interface LinkCtiProps {
  handleModalToggle: () => void;
  statusCTI: ISubscriptionResponse;
  refetchStatus: (options?: { silent?: boolean }) => Promise<void>;
  /** Called after device authorization succeeds so polling can start at `interval`. */
  onDeviceFlowStarted?: () => void;
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
  refetchStatus: (options?: { silent?: boolean }) => Promise<void>;
  onOpenModal: () => void;
}
