import React from 'react';
import { EuiToolTip, EuiButtonEmpty } from '@elastic/eui';
import ReportingHandler from './reporting-handler';
import moment from 'moment-timezone';
import { getHttp, getUiSettings } from '../../../../../../kibana-services';
import { formatUIDate } from '../../../../../../react-services/time-service';
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
          sortable: true,
        },
        {
          field: 'size',
          name: 'Size',
          render: size => {
            const fixedSize = size / 1024;
            return `${fixedSize.toFixed(2)}KB`;
          },
          sortable: true,
        },
        {
          field: 'date',
          name: 'Created',
          render: value => formatUIDate(value),
          sortable: true,
        },
      ];
      this.columns.push({
        name: 'Actions',
        align: 'left',
        render: item => {
          return (
            <div>
              <EuiToolTip position='top' content={`Download report`}>
                <EuiButtonEmpty
                  aria-label='Dowload report'
                  iconType='importAction'
                  href={getHttp().basePath.prepend(`/reports/${item.name}`)}
                  target='_blank'
                  color='primary'
                  contentProps={{ className: 'wz-no-padding' }}
                />
              </EuiToolTip>

              <EuiButtonEmpty
                buttonType='icon'
                aria-label='Delete report'
                iconType='trash'
                tooltip={{ position: 'top', content: 'Delete report' }}
                onClick={async () => {
                  this.tableProps.updateListItemsForRemove([item]);
                  this.tableProps.updateShowModal(true);
                }}
                color='danger'
                isDisabled={item.name === 'default'}
                contentProps={{ className: 'wz-no-padding' }}
              />
            </div>
          );
        },
      });
    };

    this.buildColumns();
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
