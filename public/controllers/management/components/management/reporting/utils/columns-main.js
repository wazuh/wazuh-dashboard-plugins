import React from 'react';
import { EuiToolTip, EuiButtonIcon } from '@elastic/eui';
import ReportingHandler from './reporting-handler';

import chrome from 'ui/chrome';
import moment from 'moment-timezone';
import { WzButtonPermissions } from '../../../../../../components/common/permissions/button';
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../../../../../util/constants';

export default class ReportingColums {
  constructor(tableProps) {
    this.tableProps = tableProps;
    this.reportingHandler = ReportingHandler;

    this.buildColumns = () => {
      this.columns = [
        {
          field: 'name',
          name: 'File',
          align: 'left',
          sortable: true
        },
        {
          field: 'size',
          name: 'Size',
          render: size => {
            const fixedSize = size / 1024;
            return `${fixedSize.toFixed(2)}KB`;
          },
          sortable: true
        },
        {
          field: 'date',
          name: 'Created',
          render: value => this.offsetTimestamp(value),
          sortable: true
        }
      ];
      this.columns.push({
        name: 'Actions',
        align: 'left',
        render: item => {
          return (
            <div>
              <EuiToolTip position="top" content={`Download report`}>
                <EuiButtonIcon
                  aria-label="Dowload report"
                  iconType="importAction"
                  onClick={() => this.goReport(item.name)}
                  color="primary"
                />
              </EuiToolTip>

              <WzButtonPermissions
                buttonType='icon'
                roles={[WAZUH_ROLE_ADMINISTRATOR_NAME]}
                aria-label="Delete report"
                iconType="trash"
                tooltip={{position: 'top', content: 'Delete report'}}
                onClick={async () => {
                  this.tableProps.updateListItemsForRemove([item]);
                  this.tableProps.updateShowModal(true);
                }}
                color="danger"
                isDisabled={item.name === 'default'}
              />
            </div>
          );
        }
      });
    };

    this.buildColumns();
  }

  /**
   * Downloads the report
   * @param {*} name The name of the report
   */
  goReport(name) {
    window.open(chrome.addBasePath(`/reports/${name}`), '_blank');
  }

  /**
   * Returns given date adding the timezone offset
   * @param {string} date Date
   */
  offset(d) {
    try {
      const dateUTC = moment.utc(d);
      const kibanaTz = chrome.getUiSettingsClient().get('dateFormat:tz');
      const dateLocate =
        kibanaTz === 'Browser'
          ? moment(dateUTC).local()
          : moment(dateUTC).tz(kibanaTz);
      return dateLocate.format('YYYY/MM/DD HH:mm:ss');
    } catch (error) {
      throw new Error(error);
    }
  }

  /**
   * Transform a give date applying the browser's offset
   * @param {*} time
   */
  offsetTimestamp(time) {
    try {
      return this.offset(time);
    } catch (error) {
      return time !== '-' ? `${time} (UTC)` : time;
    }
  }
}
