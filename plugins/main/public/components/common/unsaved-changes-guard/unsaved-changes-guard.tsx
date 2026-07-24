/*
 * Wazuh app - Generic opt-in guard that confirms discarding unsaved changes
 * Copyright (C) 2015-2025 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { EuiConfirmModal, EuiFlyout, EuiOverlayMask } from '@elastic/eui';

export interface UnsavedChangesGuardContextValue {
  /** True when an UnsavedChangesGuardedFlyout is mounted above. */
  active: boolean;
  /** Runs the action immediately while no owner reports unsaved changes;
   * otherwise holds it until the user confirms it in the dialog. */
  guardAction: (action: () => void) => void;
  reportUnsavedChanges: (ownerId: symbol, hasUnsavedChanges: boolean) => void;
  clearUnsavedChanges: (ownerId: symbol) => void;
}

const noop = () => {};

// Default value = no provider above: the guard is inactive and guarded
// actions pass straight through.
export const UnsavedChangesGuardContext =
  createContext<UnsavedChangesGuardContextValue>({
    active: false,
    guardAction: action => action(),
    reportUnsavedChanges: noop,
    clearUnsavedChanges: noop,
  });

export const useUnsavedChangesGuard = (): UnsavedChangesGuardContextValue =>
  useContext(UnsavedChangesGuardContext);

/**
 * Reports whether the calling component holds unsaved changes to the
 * nearest UnsavedChangesGuardedFlyout. No-op when there is none above.
 */
export function useReportUnsavedChanges(hasUnsavedChanges: boolean): void {
  const { active, reportUnsavedChanges, clearUnsavedChanges } =
    useUnsavedChangesGuard();
  const ownerIdRef = useRef<symbol | undefined>(undefined);
  if (ownerIdRef.current === undefined) {
    ownerIdRef.current = Symbol('unsaved-changes-owner');
  }

  useEffect(() => {
    if (!active) {
      return;
    }
    reportUnsavedChanges(ownerIdRef.current as symbol, hasUnsavedChanges);
  }, [active, reportUnsavedChanges, hasUnsavedChanges]);

  useEffect(() => {
    if (!active) {
      return;
    }
    const ownerId = ownerIdRef.current as symbol;
    return () => clearUnsavedChanges(ownerId);
  }, [active, clearUnsavedChanges]);
}

type UnsavedChangesGuardedFlyoutProps = React.ComponentProps<typeof EuiFlyout>;

export const UnsavedChangesGuardedFlyout: React.FC<
  UnsavedChangesGuardedFlyoutProps
> = ({ onClose, children, ...rest }) => {
  const dirtyOwnersRef = useRef<Map<symbol, boolean> | undefined>(undefined);
  if (!dirtyOwnersRef.current) {
    dirtyOwnersRef.current = new Map();
  }
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const guardAction = useCallback((action: () => void) => {
    const hasUnsavedChanges = Array.from(
      (dirtyOwnersRef.current as Map<symbol, boolean>).values(),
    ).some(Boolean);
    if (hasUnsavedChanges) {
      setPendingAction(() => action);
    } else {
      action();
    }
  }, []);

  const reportUnsavedChanges = useCallback(
    (ownerId: symbol, hasUnsavedChanges: boolean) => {
      (dirtyOwnersRef.current as Map<symbol, boolean>).set(
        ownerId,
        hasUnsavedChanges,
      );
    },
    [],
  );

  const clearUnsavedChanges = useCallback((ownerId: symbol) => {
    (dirtyOwnersRef.current as Map<symbol, boolean>).delete(ownerId);
  }, []);

  const contextValue = useMemo(
    () => ({
      active: true,
      guardAction,
      reportUnsavedChanges,
      clearUnsavedChanges,
    }),
    [guardAction, reportUnsavedChanges, clearUnsavedChanges],
  );

  const cancelPendingAction = useCallback(() => setPendingAction(null), []);
  const confirmPendingAction = useCallback(
    (event?: React.SyntheticEvent | KeyboardEvent) => {
      const isExplicitYes = Boolean(
        (event?.target as HTMLElement | undefined)?.closest?.(
          '[data-test-subj="confirmModalCancelButton"]',
        ),
      );
      setPendingAction(null);
      if (isExplicitYes) {
        pendingAction?.();
      }
    },
    [pendingAction],
  );

  return (
    <UnsavedChangesGuardContext.Provider value={contextValue}>
      <EuiFlyout {...rest} onClose={() => guardAction(onClose)}>
        {children}
      </EuiFlyout>
      {pendingAction && (
        <EuiOverlayMask>
          <EuiConfirmModal
            title='Unsubmitted changes'
            onConfirm={cancelPendingAction}
            onCancel={confirmPendingAction}
            cancelButtonText='Yes, do it'
            confirmButtonText="No, don't do it"
          >
            <p style={{ textAlign: 'center' }}>
              There are unsaved changes. Are you sure you want to proceed?
            </p>
          </EuiConfirmModal>
        </EuiOverlayMask>
      )}
    </UnsavedChangesGuardContext.Provider>
  );
};
