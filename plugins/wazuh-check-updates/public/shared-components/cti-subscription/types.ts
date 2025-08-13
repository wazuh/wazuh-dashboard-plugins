import { Dispatch, SetStateAction } from 'react';

export interface LinkCtiProps {
  handleModalToggle: () => void;
  handleStatusModalToggle?: () => void;
  isNewHomePageEnable?: boolean;
}

export enum CtiStatus {
  SUCCESS = 'success',
  PENDING = 'pending',
  INACTIVE = 'inactive',
}

export interface StatusCtiSubscriptionProps {
  isActive: CtiStatus;
  setIsActive: Dispatch<SetStateAction<CtiStatus>>;
}

export interface CtiSubscriptionProps {
  isNewHomePageEnable?: boolean;
}

export interface StatusCtiModalProps {
  handleStatusModalToggle: () => void;
  setIsActive: Dispatch<SetStateAction<CtiStatus>>;
  isActive: CtiStatus;
}
