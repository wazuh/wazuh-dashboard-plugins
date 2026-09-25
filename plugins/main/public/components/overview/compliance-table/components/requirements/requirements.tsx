/*
 * Wazuh app - Mitre alerts components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import {
  EuiTitle,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFacetButton,
  EuiIcon,
  EuiPopover,
  EuiContextMenu,
  EuiButtonIcon,
  EuiFacetGroup,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { requirementsName } from '../../requirement-name';
import { WAZUH_MODULES } from '../../../../../../common/wazuh-modules';

export class ComplianceRequirements extends Component {
  _isMount = false;
  state: {
    isPopoverOpen: boolean;
  };

  props!: {
    requirementCounts?: Record<string, number>;
    descriptions?: Record<string, { title: string }>;
    section?: string;
  };

  constructor(props) {
    super(props);
    this.state = {
      isPopoverOpen: false,
    };
  }

  facetClicked(id) {
    const { selectedRequirements: oldSelected, onChangeSelectedRequirements } =
      this.props;
    const selectedRequirements = {
      ...oldSelected,
      [id]: !oldSelected[id],
    };
    onChangeSelectedRequirements(selectedRequirements);
  }

  getRequirementsList() {
    const requirementCounts = this.props.requirementCounts || {};
    const requirementIds = Object.keys(this.props.complianceObject);
    const requirementList: Array<any> = requirementIds.map(item => {
      let quantity = 0;
      // Each requirement is already counted over every code it is written
      // with; a group totals the requirements it holds.
      this.props.complianceObject[item].forEach(subitem => {
        quantity += requirementCounts[subitem] || 0;
      });
      return {
        id: item,
        label: item,
        quantity,
        onClick: id => this.facetClicked(id),
      };
    });

    return (
      <>
        {requirementList
          .sort((a, b) => {
            const quantityDiff = b.quantity - a.quantity;

            if (quantityDiff !== 0) {
              return quantityDiff;
            }

            return String(a.label).localeCompare(String(b.label), undefined, {
              numeric: true,
            });
          })
          .map(facet => {
            let iconNode;
            const requirementLabel = i18n.translate(
              'wazuh.complianceTable.requirementsPanel.facetLabel',
              {
                defaultMessage: 'Requirement {requirement}',
                values: { requirement: facet.label },
              },
            );
            // A group is named by its framework, or, where the group is a
            // requirement of its own (a NIS2 article holds the points of its
            // paragraphs), by the title the standard gives that requirement.
            const ownTitle = this.props.descriptions?.[facet.label]?.title;
            const name =
              requirementsName[this.props.section]?.[facet.label] ||
              (ownTitle && `${facet.label} - ${ownTitle}`) ||
              requirementLabel;
            return (
              <EuiFacetButton
                key={'Requirement ' + facet.id}
                id={`Requirement ${facet.id}`}
                quantity={facet.quantity}
                isSelected={this.props.selectedRequirements[facet.id]}
                isLoading={this.props.loadingAlerts}
                icon={iconNode}
                onClick={
                  facet.onClick ? () => facet.onClick(facet.id) : undefined
                }
              >
                <EuiToolTip
                  position='top'
                  content={name}
                  anchorClassName='wz-display-inline-grid'
                >
                  <span
                    style={{
                      display: 'block',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {requirementLabel}
                  </span>
                </EuiToolTip>
              </EuiFacetButton>
            );
          })}
      </>
    );
  }

  onGearButtonClick() {
    this.setState({ isPopoverOpen: !this.state.isPopoverOpen });
  }

  closePopover() {
    this.setState({ isPopoverOpen: false });
  }

  selectAll(status) {
    const { selectedRequirements, onChangeSelectedRequirements } = this.props;
    Object.keys(selectedRequirements).map(item => {
      selectedRequirements[item] = status;
    });
    onChangeSelectedRequirements(selectedRequirements);
  }

  render() {
    const panels = [
      {
        id: 0,
        title: i18n.translate(
          'wazuh.complianceTable.requirementsPanel.optionsTitle',
          {
            defaultMessage: 'Options',
          },
        ),
        items: [
          {
            name: i18n.translate(
              'wazuh.complianceTable.requirementsPanel.selectAll',
              {
                defaultMessage: 'Select all',
              },
            ),
            icon: <EuiIcon type='check' size='m' />,
            onClick: () => {
              this.closePopover();
              this.selectAll(true);
            },
          },
          {
            name: i18n.translate(
              'wazuh.complianceTable.requirementsPanel.unselectAll',
              {
                defaultMessage: 'Unselect all',
              },
            ),
            icon: <EuiIcon type='cross' size='m' />,
            onClick: () => {
              this.closePopover();
              this.selectAll(false);
            },
          },
        ],
      },
    ];
    let sectionStyle = {};
    let title = '';

    title = WAZUH_MODULES?.[this.props.section]?.title || '';
    if (this.props.section === 'gdpr') {
      sectionStyle['height'] = 300;
    }
    if (this.props.section === 'tsc') {
      sectionStyle['height'] = 350;
    }
    return (
      <div
        style={{
          backgroundColor: '#80808014',
          padding: '10px 10px 0 10px',
          minHeight: 300,
          height: '100%',
        }}
      >
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle size='m'>
              <h1>{title}</h1>
            </EuiTitle>
          </EuiFlexItem>

          <EuiFlexItem
            grow={false}
            style={{ marginTop: '15px', marginRight: 8 }}
          >
            <EuiPopover
              button={
                <EuiButtonIcon
                  iconType='gear'
                  onClick={() => this.onGearButtonClick()}
                ></EuiButtonIcon>
              }
              isOpen={this.state.isPopoverOpen}
              panelPaddingSize='none'
              closePopover={() => this.closePopover()}
            >
              <EuiContextMenu initialPanelId={0} panels={panels} />
            </EuiPopover>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFacetGroup style={{}}>{this.getRequirementsList()}</EuiFacetGroup>
      </div>
    );
  }
}
