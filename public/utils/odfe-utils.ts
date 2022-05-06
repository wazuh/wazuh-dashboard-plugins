/*
 * Wazuh app - Module with utilities for Opendistro
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { AxiosError } from 'axios'

type TAuthenticationRequiredError = {
  statusCode: 401
  error: 'Unauthorized'
  message: 'Authentication required'
}

const isAuthenticationRequired = (e: any): e is TAuthenticationRequiredError => {
  const statusCode = e.statusCode && e.statusCode === 401;
  const error = e.error && e.error === 'Unauthorized';
  const message = e.message && e.message === 'Authentication required';
  return statusCode && error && message;
}

export const checkOdfeSessionExpired = (error: AxiosError<TAuthenticationRequiredError>) => {
  const { data } = (error || {}).response || {};
  if (isAuthenticationRequired(data || {})) {
    location.reload();
  }
}
