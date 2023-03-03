import React from 'react';
import { EuiToolTip, EuiButtonIcon } from '@elastic/eui';
import ReportingHandler from './reporting-handler';
import moment from 'moment-timezone';
import { WzButtonPermissions } from '../../../../../../components/common/permissions/button';
import { WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../../../../../common/constants';
import { getHttp, getUiSettings } from '../../../../../../kibana-services';
import { formatUIDate } from '../../../../../../react-services/time-service';

import { i18n } from '@kbn/i18n';

export default class ReportingColums {
  constructor(tableProps) {
    this.tableProps = tableProps;
    this.reportingHandler = ReportingHandler;

    this.buildColumns = () => {
      this.columns = [
        {
          field: 'name',
          name: i18n.translate(
            'wazuh.public.controller.management.reports.utils.column.File',
            {
              defaultMessage: 'File',
            },
          ),
          align: 'left',
          sortable: true,
        },
        {
          field: 'size',
          name: i18n.translate(
            'wazuh.public.controller.management.reports.utils.column.Size',
            {
              defaultMessage: 'Size',
            },
          ),
          render: size => {
            const fixedSize = size / 1024;
            return `${fixedSize.toFixed(2)}KB`;
          },
          sortable: true,
        },
        {
          field: 'date',
          name: i18n.translate(
            'wazuh.public.controller.management.reports.utils.column.Created',
            {
              defaultMessage: 'Created',
            },
          ),
          render: value => formatUIDate(value),
          sortable: true,
        },
      ];
      this.columns.push({
        name: i18n.translate(
          'wazuh.public.controller.management.reports.utils.column.Actions',
          {
            defaultMessage: 'Actions',
          },
        ),
        align: 'left',
        render: item => {
          return (
            <div>
              <EuiToolTip
                position='top'
                content={i18n.translate(
                  'wazuh.public.controller.management.reports.utils.column.Dowloadreport',
                  {
                    defaultMessage: 'Dowload report',
                  },
                )}
              >
                <EuiButtonIcon
                  aria-label={i18n.translate(
                    'wazuh.public.controller.management.reports.utils.column.Dowloadreport',
                    {
                      defaultMessage: 'Dowload report',
                    },
                  )}
                  iconType='importAction'
                  onClick={() => this.goReport(item.name)}
                  color='primary'
                />
              </EuiToolTip>

              <WzButtonPermissions
                buttonType='icon'
                roles={[WAZUH_ROLE_ADMINISTRATOR_NAME]}
                aria-label={i18n.translate(
                  'wazuh.public.controller.management.reports.utils.column.Deletereport',
                  {
                    defaultMessage: 'Delete report',
                  },
                )}
                iconType='trash'
                tooltip={{
                  position: 'top',
                  content: i18n.translate(
                    'wazuh.public.controller.management.reports.utils.column.Deletereport',
                    {
                      defaultMessage: 'Delete report',
                    },
                  ),
                }}
                onClick={async () => {
                  this.tableProps.updateListItemsForRemove([item]);
                  this.tableProps.updateShowModal(true);
                }}
                color='danger'
                isDisabled={item.name === 'default'}
              />
            </div>
          );
        },
      });
    };

    this.buildColumns();
  }

  /**
   * Downloads the report
   * @param {*} name The name of the report
   */
  goReport(name) {
    window.open(getHttp().basePath.prepend(`/reports/${name}`), '_blank');
  }

  /**
   * Returns given date adding the timezone offset
   * @param {string} date Date
   */
  offset(d) {
    try {
      const dateUTC = moment.utc(d);
      const kibanaTz = getUiSettings().get('dateFormat:tz');
      const dateLocate =
        kibanaTz === 'Browser'
          ? moment(dateUTC).local()
          : moment(dateUTC).tz(kibanaTz);
      return dateLocate.format('YYYY/MM/DD HH:mm:ss');
    } catch (error) {
      throw new Error(error);
    }
  }
}
