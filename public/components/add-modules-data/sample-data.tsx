/*
 * Wazuh app - React component for add sample data
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import {
    EuiFlexItem,
    EuiCard,
    EuiSpacer,
    EuiFlexGrid,
    EuiFlexGroup,
    EuiButton,
    EuiTitle,
    EuiToolTip,
    EuiButtonIcon
} from '@elastic/eui';
import { toastNotifications } from 'ui/notify';


export class SampleData extends Component {
  showToast = (color, title, text, time) => {
      toastNotifications.add({
          color: color,
          title: title,
          text: text,
          toastLifeTimeMs: time,
      });
  };

  generateSampleData(index) {

  }

  tabIndex() {
    return [
      {
        id: 'security',
        title: 'Security Information',
        description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque, quas enim! Commodi, obcaecati quis ea ducimus vel reprehenderit, dolor distinctio quaerat.',
        footer: this.renderActionButtons()
      },
      {
        title: 'Auditing and Policy Monitoring',
        description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque, quas enim! Commodi, obcaecati quis ea ducimus vel reprehenderit, dolor distinctio quaerat.',
        footer: this.renderActionButtons()
      },
      {
        title: 'Threat detection and response',
        description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque, quas enim! Commodi, obcaecati quis ea ducimus vel reprehenderit, dolor distinctio quaerat.',
        footer: this.renderActionButtons()
      },
      {
        title: 'Regulatory Compliance',
        description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque, quas enim! Commodi, obcaecati quis ea ducimus vel reprehenderit, dolor distinctio quaerat.',
        footer: this.renderActionButtons()
      },
    ]
  }

  rendenderTabs() {
    const tabs = this.tabIndex();
    let auxTabs: any = [];

    tabs.map((tab, index)=> {
      auxTabs.push(
        <EuiFlexItem key={index}>
          <EuiCard
            textAlign={'left'}
            title={tab.title}
            description={tab.description}
            footer={tab.footer}
          />
        </EuiFlexItem>
      )
    });

    return auxTabs;
  }

  renderActionButtons() {
    return (
      <EuiFlexGroup justifyContent="flexEnd">
        <EuiFlexItem grow={false}>
          <EuiButton
            isLoading={false}
            onClick={() => this.showToast('success', `Sample logs instaled`, '', 5000)}>
                Add Data
          </EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }

  render() {
    const tabsSection = this.rendenderTabs();
    
    return(
      <Fragment>
        <EuiFlexGrid columns={3}>
          {tabsSection.map(tab => tab)}
        </EuiFlexGrid>
      </Fragment>
    )
  }
}