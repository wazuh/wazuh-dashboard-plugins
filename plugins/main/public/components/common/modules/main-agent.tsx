/*
 * Wazuh app - Integrity monitoring components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import { EuiFlexGroup, EuiFlexItem, EuiTabs, EuiTab } from '@elastic/eui';
import '../../common/modules/module.scss';
import { toTitleCase } from '../util/change-case';
import clsx from 'clsx';
import { AgentTabs } from '../../endpoints-summary/agent/agent-tabs';
import { Agent } from '../../endpoints-summary/types';
import { ButtonExploreAgent } from '../../wz-agent-selector/button-explore-agent';

export class MainModuleAgent extends Component {
  props!: {
    agent: Agent;
    section: string;
    switchTab?: (tab: string) => void;
    selectView?: boolean;
    tabs?: any[];
    renderTabs?: () => JSX.Element;
    agentsSelectionProps?: any;
    unPinAgent?: () => void;
  };

  renderTitle() {
    const { section } = this.props;
    return (
      <EuiFlexGroup style={{ marginInline: 8 }}>
        <EuiFlexItem style={{ marginInline: 0 }}>
          <EuiTabs data-test-subj='agent-tabs'>
            <EuiTab data-test-subj={`agent-tab-${section}`} isSelected={true}>
              {toTitleCase(section)}
            </EuiTab>
          </EuiTabs>
        </EuiFlexItem>
        <EuiFlexItem
          grow={false}
          className='euiTabs'
          style={{ marginInline: 0, paddingInline: 12 }}
        >
          <ButtonExploreAgent onUnpinAgent={this.props.unPinAgent} />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  render() {
    const { agent, section, selectView } = this.props;
    const ModuleTabView = this.props.tabs?.find(tab => tab.id === selectView);

    const hasTabs = this.props.tabs?.length;

    return (
      <div className={'wz-module'}>
        {agent?.os && (
          <Fragment>
            <div className='wz-module-header-agent-wrapper'>
              <div className='wz-module-header-agent'>{this.renderTitle()}</div>
            </div>
            <div>
              <div className={clsx({ 'wz-module-header-nav': hasTabs })}>
                {hasTabs && (
                  <div className='wz-welcome-page-agent-tabs'>
                    <EuiFlexGroup>
                      {this.props.renderTabs?.()}
                      <EuiFlexItem
                        grow={false}
                        style={{ marginTop: 6, marginRight: 5 }}
                      >
                        <EuiFlexGroup>
                          {ModuleTabView?.buttons?.map(
                            (ModuleViewButton, index) =>
                              typeof ModuleViewButton !== 'string' ? (
                                <EuiFlexItem key={`module_button_${index}`}>
                                  <ModuleViewButton
                                    {...{
                                      ...this.props,
                                      ...this.props.agentsSelectionProps,
                                    }}
                                    moduleID={section}
                                  />
                                </EuiFlexItem>
                              ) : null,
                          )}
                        </EuiFlexGroup>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                  </div>
                )}
              </div>
            </div>
            {[AgentTabs.STATS].includes(section) &&
              ModuleTabView?.component && (
                <ModuleTabView.component {...this.props} moduleID={section} />
              )}
          </Fragment>
        )}
      </div>
    );
  }
}
