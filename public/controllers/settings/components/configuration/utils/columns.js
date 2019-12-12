import React, { Component } from 'react';

import { EuiToolTip, EuiFieldText, EuiButtonIcon, EuiFieldNumber } from '@elastic/eui';

export default class configurationColumns {
  constructor(functions, editingKey) {
    this.setEditingKey = functions.setEditingKey;
    this.newValueItem = functions.newValueItem;
    this.editKey = functions.editKey;

    this.buildColumns = () => {
      this.columns = [
        {
          field: 'setting',
          name: 'Setting',
          align: 'left',
          sortable: true,
        },
        {
          field: 'value',
          name: 'Value',
          align: 'left',
          sortable: true,
          render: (value, item) => {
            if (
              editingKey === item.setting &&
              item.typeof === 'string' &&
              value !== 'logs.level' &&
              value !== 'wazuh.monitoring.creation'
            ) {
              return (
                <EuiFieldText
                  onChange={event => {
                    this.newValueItem(event.target.value, item.setting, item.typeof);
                  }}
                  value={value}
                />
              );
            }
            if (editingKey === item.setting && item.typeof === 'number') {
              return (
                <EuiFieldNumber
                  value={value}
                  min={0}
                  onChange={event => {
                    this.newValueItem(event.target.value, item.setting, item.typeof);
                  }}
                />
              );
            }

            return <h2>{value}</h2>;
          },
        },
        {
          field: 'description',
          name: 'Description',
          align: 'left',
          sortable: true,
        },
      ];

      this.columns.push({
        name: 'Actions',
        align: 'right',
        render: item => {
          if (editingKey !== item.setting) {
            return (
              <div>
                <EuiToolTip position="top" content={`Edit ${item.settings} value`}>
                  <EuiButtonIcon
                    aria-label="Edit content"
                    iconType="pencil"
                    onClick={async () => {
                      this.setEditingKey(item.setting);
                    }}
                    color="primary"
                  />
                </EuiToolTip>
              </div>
            );
          } else {
            return (
              <div>
                <EuiToolTip position="top" content={`Cancel`}>
                  <EuiButtonIcon
                    aria-label="Cancel"
                    iconType="cross"
                    onClick={async () => {
                      this.setEditingKey(null);
                    }}
                    color="primary"
                  />
                </EuiToolTip>
                <EuiToolTip position="top" content={`Apply`}>
                  <EuiButtonIcon
                    aria-label="Edit content"
                    iconType="check"
                    onClick={async () => {
                      console.log('Apply ', item);
                      this.editKey(item.setting, item.value);
                    }}
                    color="primary"
                  />
                </EuiToolTip>
              </div>
            );
          }
        },
      });
    };

    this.buildColumns();
  }

  setNewValue(event) {
    console.log(event.target.value);
  }
}
