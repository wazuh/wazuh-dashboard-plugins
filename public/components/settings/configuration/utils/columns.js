import React from 'react';

import {
  EuiToolTip,
  EuiFieldText,
  EuiButtonIcon,
  EuiFieldNumber,
  EuiSelect,
  EuiTextArea,
  EuiIconTip
} from '@elastic/eui';

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
          width: '200px'
        },
        {
          field: 'value',
          name: 'Value',
          align: 'left',
          sortable: true,
          width: '150px',
          render: (value, item) => {
            if (
              editingKey === item.setting &&
              item.typeof === 'string' &&
              item.setting !== 'logs.level' &&
              item.setting !== 'wazuh.monitoring.creation'
            ) {
              return (
                <EuiFieldText
                  onChange={event => {
                    this.newValueItem(
                      event.target.value,
                      item.setting,
                      item.typeof
                    );
                  }}
                  value={value}
                  aria-label="Edit"
                />
              );
            }
            if (editingKey === item.setting && item.typeof === 'number') {
              return (
                <EuiFieldNumber
                  value={value}
                  min={0}
                  onChange={event => {
                    this.newValueItem(
                      event.target.value,
                      item.setting,
                      item.typeof
                    );
                  }}
                  aria-label="Edit"
                />
              );
            }
            if (editingKey === item.setting && item.typeof === 'boolean') {
              return (
                <EuiSelect
                  id="select"
                  options={[
                    { value: true, text: 'true' },
                    { value: false, text: 'false' }
                  ]}
                  value={value}
                  onChange={event => {
                    this.newValueItem(
                      event.target.value,
                      item.setting,
                      item.typeof
                    );
                  }}
                  aria-label="Select boolean"
                />
              );
            }
            if (
              editingKey === item.setting &&
              item.setting === 'wazuh.monitoring.creation'
            ) {
              return (
                <EuiSelect
                  id="select"
                  options={[
                    { value: 'h', text: 'hourly' },
                    { value: 'd', text: 'daily' },
                    { value: 'w', text: 'weekly' },
                    { value: 'm', text: 'monthly' }
                  ]}
                  value={value}
                  onChange={event => {
                    this.newValueItem(
                      event.target.value,
                      item.setting,
                      item.typeof
                    );
                  }}
                  aria-label="Select creation"
                />
              );
            }
            if (editingKey === item.setting && item.setting === 'logs.level') {
              return (
                <EuiSelect
                  id="select"
                  options={[
                    { value: 'info', text: 'info' },
                    { value: 'debug', text: 'debug' }
                  ]}
                  value={value}
                  onChange={event => {
                    this.newValueItem(
                      event.target.value,
                      item.setting,
                      item.typeof
                    );
                  }}
                  aria-label="Select creation"
                />
              );
            }
            if (editingKey === item.setting && item.typeof === 'object') {
              return (
                <EuiTextArea
                  onChange={event => {
                    this.newValueItem(
                      event.target.value,
                      item.setting,
                      item.typeof
                    );
                  }}
                  value={value}
                  aria-label="Edit"
                  rows={2}
                />
              );
            }
            if (item.typeof === 'boolean' && editingKey !== item.setting) {
              return <span>{value ? 'true' : 'false'}</span>;
            }
            if (item.typeof === 'object' && editingKey !== item.setting) {
              return <span>{JSON.stringify(value)}</span>;
            }
            return <span>{value}</span>;
          }
        },
        {
          field: 'description',
          name: 'Description',
          align: 'left',
          sortable: true,
          render: (value, item) => {
            if (item.setting !== 'ip.ignore') {
              return <span>{value}</span>;
            } else {
              return (
                <span>
                  {value}
                  <EuiIconTip
                    aria-label="Info"
                    size="l"
                    type="questionInCircle"
                    color="primary"
                    content="Format: You have to separate your items by ',' or by 'line break'."
                  />
                </span>
              );
            }
          }
        }
      ];

      this.columns.push({
        name: 'Actions',
        align: 'right',
        width: '125px',
        render: item => {
          if (item.setting !== 'admin') {
            if (editingKey !== item.setting) {
              return (
                <div>
                  <EuiToolTip position="top" content={`Edit value`}>
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
                        this.editKey(
                          item.setting,
                          item.setting === 'ip.ignore'
                            ? this.formatObject(item.value)
                            : item.value,
                          item.typeof
                        );
                      }}
                      color="primary"
                    />
                  </EuiToolTip>
                </div>
              );
            }
          }
        }
      });
    };

    this.buildColumns();
  }

  formatObject(value) {
    let arrayValues = [];
    for (const itemWithCommas of value.split('\n')) {
      for (const itemWithoutCommas of itemWithCommas.split(',')) {
        let item = itemWithoutCommas.trim();
        if (item.length !== 0) {
          arrayValues.push(
            (item[0] !== '"' ? '"' : '') +
              item +
              (item[item.length - 1] !== '"' ? '"' : '')
          );
        }
      }
    }

    return '[' + arrayValues.join() + ']';
  }
}
