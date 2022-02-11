/*
 * Wazuh app - Component that renders the toast notification modal
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Fragment, useState, useEffect } from 'react';

import {
  EuiModal,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiModalBody,
  EuiCallOut,
  EuiSpacer,
  EuiCodeBlock,
  EuiModalFooter,
  EuiButton,
  EuiOverlayMask,
  EuiOutsideClickDetector,
  EuiCopy
} from '@elastic/eui';

import { useSelector, useDispatch } from 'react-redux';
import { updateToastNotificationsModal } from '../../redux/actions/appStateActions';
import { withReduxProvider, withErrorBoundary } from '../common/hocs';
import { compose } from 'redux';

export const ToastNotificationsModal = compose (withErrorBoundary, withReduxProvider)(() => {
  const [isOpen, setIsOpen] = useState(false);
  const toastNotification = useSelector(state => state.appStateReducers.toastNotification);
  const dispatch = useDispatch();
  const closeModal = () => setIsOpen(false);

  useEffect(() => {
    if(!isOpen){
      dispatch(updateToastNotificationsModal(false));
    }
  }, [isOpen]);


  useEffect(() => {
    if(toastNotification){
      setIsOpen(true);
    }
  }, [toastNotification]);

  if(!toastNotification){
    return null;
  };
  const errorStack = (toastNotification.error && toastNotification.error.stack) || '';
  const calloutTitle = toastNotification.path ? `[${toastNotification.path}] > ${toastNotification.error.message}` : toastNotification.error.message;
  const copyMessage = `\`\`\`**${toastNotification.title}**
  ${calloutTitle}
  ${errorStack}
  \`\`\``
  return (
    <EuiOverlayMask>
      <EuiOutsideClickDetector onOutsideClick={() => closeModal()}>
        <EuiModal onClose={closeModal}>
          <EuiModalHeader>
            <EuiModalHeaderTitle>{toastNotification.title}</EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <EuiCallOut size="s" color="danger" iconType="alert" title={calloutTitle} />
            {errorStack && (
              <Fragment>
                <EuiSpacer size="s" />
                <EuiCodeBlock /*isCopyable={true}*/ paddingSize="s">
                  {errorStack}
                </EuiCodeBlock>
              </Fragment>
            )}
          </EuiModalBody>
          <EuiModalFooter>
            <EuiCopy textToCopy={copyMessage}>
              {copy => <EuiButton fill onClick={copy}>Copy error</EuiButton>}
            </EuiCopy>
          </EuiModalFooter>
        </EuiModal>
      </EuiOutsideClickDetector>
    </EuiOverlayMask>
  )
})