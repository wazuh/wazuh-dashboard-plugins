/*
 * Wazuh app - Prompt when an agent doesn't support any module
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
import { useDispatch } from 'react-redux';
import { EuiEmptyPrompt, EuiButton } from '@elastic/eui';
import { showExploreAgentModal } from '../../redux/actions/appStateActions';
import { i18n } from '@kbn/i18n';

export const PromptAgentNoSupportModule = () => {
  const dispatch = useDispatch();
  const openAgentSelector = () => dispatch(showExploreAgentModal(true));
  return (
    <EuiEmptyPrompt
      iconType="watchesApp"
      title={<h2>{
        i18n.translate("wazuh.components.agent.fim.ivv.lib.agent.notSupported", {
          defaultMessage: "Module not supported by the agent",
        })}</h2>}
      actions={
        <EuiButton color="primary" fill onClick={openAgentSelector}>
          {
            i18n.translate("wazuh.components.agent.fim.ivv.lib.seagent", {
              defaultMessage: "Select agent",
            })}
        </EuiButton>
      }
    />
  )
}
