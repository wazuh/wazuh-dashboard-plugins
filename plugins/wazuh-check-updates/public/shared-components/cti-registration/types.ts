export interface LinkCtiProps {
  handleModalToggle: () => void;
  handleStatusModalToggle?: () => void;
}

export enum CtiStatus {
  AVAILABLE = 'available',
  PENDING = 'pending',
  DENIED = 'denied',
  POLLING = 'polling',
}

export interface StatusCtiRegistrationProps {
  isActive: CtiStatus;
  checkCtiStatus: () => Promise<void>;
}

export interface StatusCtiModalProps {
  handleStatusModalToggle: () => void;
  checkCtiStatus: () => Promise<void>;
  isActive: CtiStatus;
}
