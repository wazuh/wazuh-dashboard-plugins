/*
 * Wazuh app - Service to show notifications
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Fragment } from 'react';
import store from '../redux/store';
import { updateToastNotificationsModal } from '../redux/actions/appStateActions';
import { getToasts } from '../kibana-services';
import { EuiButton } from '@elastic/eui';

export class ToastNotifications {
  static add(toast) {
    getToasts().add(toast);
  }
  static success(toast) {
    getToasts().add({
      ...toast,
      color: 'success',
    });
  }
  static warning(toast) {
    getToasts().add({
      ...toast,
      color: 'warning',
    });
  }
  static danger(toast) {
    getToasts().add({
      ...toast,
      color: 'danger',
    });
  }
  static error(path, error, title = 'Error unexpected') {
    getToasts().danger({
      title,
      iconType: 'alert',
      text: (
        <Fragment>
          <p data-test-subj="errorToastMessage">{error.message}</p>
          <div className="eui-textRight">
            <EuiButton
              color="danger"
              onClick={() => store.dispatch(updateToastNotificationsModal({ path, error, title }))}
              size="s"
            >
              See the full error
            </EuiButton>
          </div>
        </Fragment>
      ),
    });
  }
}
