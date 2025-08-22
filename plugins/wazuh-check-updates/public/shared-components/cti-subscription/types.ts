import { Dispatch, SetStateAction } from 'react';

export interface LinkCtiProps {
  handleModalToggle: () => void;
  handleStatusModalToggle?: () => void;
}

export enum CtiStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  INACTIVE = 'inactive',
}

export interface StatusCtiSubscriptionProps {
  isActive: CtiStatus;
  checkCtiStatus: () => Promise<void>;
}

export interface StatusCtiModalProps {
  handleStatusModalToggle: () => void;
  checkCtiStatus: () => Promise<void>;
  isActive: CtiStatus;
}
