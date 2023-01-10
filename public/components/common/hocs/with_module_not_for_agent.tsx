/*
 * Wazuh app - React HOC to show a prompt when a module is not available for agents and let to unpin the agent
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { withGuard } from './withGuard';
import { PromptModuleNotForAgent } from '../../agents/prompts';
import { i18n } from '@kbn/i18n';
const moduleTitle = i18n.translate(
  'wazuh.components.common.hocs.withModule.moduleTitle',
  {
    defaultMessage: 'Module not available for agents',
  },
);
const moduleBody = i18n.translate(
  'wazuh.components.common.hocs.withModule.moduleBody',
  {
    defaultMessage: 'Remove the pinned agent.',
  },
);

const mapStateToProps = state => ({
  agent: state.appStateReducers.currentAgentData,
});

export const withModuleNotForAgent = WrappedComponent =>
  compose(
    connect(mapStateToProps),
    withGuard(
      ({ agent }) => agent?.id,
      props => (
        <PromptModuleNotForAgent
          title={moduleTitle}
          body={moduleBody}
          {...props}
        />
      ),
    ),
  )(WrappedComponent);
