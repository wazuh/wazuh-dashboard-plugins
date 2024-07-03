/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApplicationStart} from '../../../../../src/core/public';

let application: ApplicationStart

export const applicationService = {
  init: (applicationStart: ApplicationStart) => {
    application = applicationStart
  },
  getApplication: () => application,
};
