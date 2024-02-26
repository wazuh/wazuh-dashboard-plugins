import fs from 'fs';
import path from 'path';
import PdfPrinter from 'pdfmake/src/printer';
import clockIconRaw from './clock-icon-raw';
import filterIconRaw from './filter-icon-raw';
import {
  AgentsVisualizations,
  OverviewVisualizations,
} from '../../integration-files/visualizations';
import * as TimSort from 'timsort';
import { REPORTS_PRIMARY_COLOR } from '../../../common/constants';
import { Logger } from 'opensearch-dashboards/server';
import { IConfiguration } from '../../../../wazuh-core/common/services/configuration';

const COLORS = {
  PRIMARY: REPORTS_PRIMARY_COLOR,
};

const pageConfiguration = ({ pathToLogo, pageHeader, pageFooter }) => ({
  styles: {
    h1: {
      fontSize: 22,
      monslight: true,
      color: COLORS.PRIMARY,
    },
    h2: {
      fontSize: 18,
      monslight: true,
      color: COLORS.PRIMARY,
    },
    h3: {
      fontSize: 16,
      monslight: true,
      color: COLORS.PRIMARY,
    },
    h4: {
      fontSize: 14,
      monslight: true,
      color: COLORS.PRIMARY,
    },
    standard: {
      color: '#333',
    },
    whiteColorFilters: {
      color: '#FFF',
      fontSize: 14,
    },
    whiteColor: {
      color: '#FFF',
    },
  },
  pageMargins: [40, 80, 40, 80],
  header: {
    margin: [40, 20, 0, 0],
    columns: [
      {
        image: path.join(__dirname, `../../../public/assets/${pathToLogo}`),
        fit: [190, 50],
      },
      {
        text: pageHeader,
        alignment: 'right',
        margin: [0, 0, 40, 0],
        color: COLORS.PRIMARY,
        width: 'auto',
      },
    ],
  },
  content: [],
  footer(currentPage, pageCount) {
    return {
      columns: [
        {
          text: pageFooter,
          color: COLORS.PRIMARY,
          margin: [40, 40, 0, 0],
        },
        {
          text: 'Page ' + currentPage.toString() + ' of ' + pageCount,
          alignment: 'right',
          margin: [0, 40, 40, 0],
          color: COLORS.PRIMARY,
          width: 'auto',
        },
      ],
    };
  },
  pageBreakBefore(currentNode, followingNodesOnPage) {
    if (currentNode.id && currentNode.id.includes('splitvis')) {
      return (
        followingNodesOnPage.length === 6 || followingNodesOnPage.length === 7
      );
    }
    if (
      (currentNode.id && currentNode.id.includes('splitsinglevis')) ||
      (currentNode.id && currentNode.id.includes('singlevis'))
    ) {
      return followingNodesOnPage.length === 6;
    }
    return false;
  },
});

const fonts = {
  Roboto: {
    normal: path.join(
      __dirname,
      '../../../public/assets/fonts/opensans/OpenSans-Light.ttf',
    ),
    bold: path.join(
      __dirname,
      '../../../public/assets/fonts/opensans/OpenSans-Bold.ttf',
    ),
    italics: path.join(
      __dirname,
      '../../../public/assets/fonts/opensans/OpenSans-Italic.ttf',
    ),
    bolditalics: path.join(
      __dirname,
      '../../../public/assets/fonts/opensans/OpenSans-BoldItalic.ttf',
    ),
    monslight: path.join(
      __dirname,
      '../../../public/assets/fonts/opensans/Montserrat-Light.ttf',
    ),
  },
};

export class ReportPrinter {
  private _content: any[];
  private _printer: PdfPrinter;
  constructor(public logger: Logger, private configuration: IConfiguration) {
    this._printer = new PdfPrinter(fonts);
    this._content = [];
  }
  addContent(...content: any) {
    this._content.push(...content);
    return this;
  }
  addConfigTables(tables: any) {
    this.logger.debug(
      `Started to render configuration tables: ${tables.length}`,
    );
    for (const table of tables) {
      let rowsparsed = table.rows;
      if (Array.isArray(rowsparsed) && rowsparsed.length) {
        const rows =
          rowsparsed.length > 100 ? rowsparsed.slice(0, 99) : rowsparsed;
        this.addContent({
          text: table.title,
          style: { fontSize: 11, color: '#000' },
          margin: table.title && table.type === 'table' ? [0, 0, 0, 5] : '',
        });

        if (table.title === 'Monitored directories') {
          this.addContent({
            text: 'RT: Real time | WD: Who-data | Per.: Permission | MT: Modification time | SL: Symbolic link | RL: Recursion level',
            style: { fontSize: 8, color: COLORS.PRIMARY },
            margin: [0, 0, 0, 5],
          });
        }

        const full_body = [];

        const modifiedRows = rows.map(row =>
          row.map(cell => ({ text: cell || '-', style: 'standard' })),
        );
        // for (const row of rows) {
        //   modifiedRows.push(
        //     row.map(cell => ({ text: cell || '-', style: 'standard' }))
        //   );
        // }
        let widths = [];
        widths = Array(table.columns.length - 1).fill('auto');
        widths.push('*');

        if (table.type === 'config') {
          full_body.push(
            table.columns.map(col => ({
              text: col || '-',
              border: [0, 0, 0, 20],
              fontSize: 0,
              colSpan: 2,
            })),
            ...modifiedRows,
          );
          this.addContent({
            fontSize: 8,
            table: {
              headerRows: 0,
              widths,
              body: full_body,
              dontBreakRows: true,
            },
            layout: {
              fillColor: i => (i === 0 ? '#fff' : null),
              hLineColor: () => '#D3DAE6',
              hLineWidth: () => 1,
              vLineWidth: () => 0,
            },
          });
        } else if (table.type === 'table') {
          full_body.push(
            table.columns.map(col => ({
              text: col || '-',
              style: 'whiteColor',
              border: [0, 0, 0, 0],
            })),
            ...modifiedRows,
          );
          this.addContent({
            fontSize: 8,
            table: {
              headerRows: 1,
              widths,
              body: full_body,
            },
            layout: {
              fillColor: i => (i === 0 ? COLORS.PRIMARY : null),
              hLineColor: () => COLORS.PRIMARY,
              hLineWidth: () => 1,
              vLineWidth: () => 0,
            },
          });
        }
        this.addNewLine();
      }
      this.logger.debug('Table rendered');
    }
  }

  addTables(tables: any) {
    this.logger.debug(`Started to render tables: ${tables.length}`);

    for (const table of tables) {
      let rowsparsed = [];
      rowsparsed = table.rows;
      if (Array.isArray(rowsparsed) && rowsparsed.length) {
        const rows =
          rowsparsed.length > 100 ? rowsparsed.slice(0, 99) : rowsparsed;
        this.addContent({
          text: table.title,
          style: 'h3',
          pageBreak: 'before',
          pageOrientation: table.columns.length >= 9 ? 'landscape' : 'portrait',
        });
        this.addNewLine();
        const full_body = [];
        const sortTableRows = (a, b) =>
          parseInt(a[a.length - 1]) < parseInt(b[b.length - 1])
            ? 1
            : parseInt(a[a.length - 1]) > parseInt(b[b.length - 1])
            ? -1
            : 0;

        TimSort.sort(rows, sortTableRows);

        const modifiedRows = rows.map(row =>
          row.map(cell => ({ text: cell || '-', style: 'standard' })),
        );

        // the width of the columns is assigned
        const widths = Array(table.columns.length - 1).fill('auto');
        widths.push('*');

        full_body.push(
          table.columns.map(col => ({
            text: col || '-',
            style: 'whiteColor',
            border: [0, 0, 0, 0],
          })),
          ...modifiedRows,
        );
        this.addContent({
          fontSize: 8,
          table: {
            headerRows: 1,
            widths,
            body: full_body,
          },
          layout: {
            fillColor: i => (i === 0 ? COLORS.PRIMARY : null),
            hLineColor: () => COLORS.PRIMARY,
            hLineWidth: () => 1,
            vLineWidth: () => 0,
          },
        });
        this.addNewLine();
        this.logger.debug('Table rendered');
      }
    }
  }
  addTimeRangeAndFilters(from, to, filters, timeZone) {
    this.logger.debug(
      `Started to render the time range and the filters: from: ${from}, to: ${to}, filters: ${filters}, timeZone: ${timeZone}`,
    );

    const fromDate = new Date(
      new Date(from).toLocaleString('en-US', { timeZone }),
    );
    const toDate = new Date(new Date(to).toLocaleString('en-US', { timeZone }));
    const str = `${this.formatDate(fromDate)} to ${this.formatDate(toDate)}`;

    this.addContent({
      fontSize: 8,
      table: {
        widths: ['*'],
        body: [
          [
            {
              columns: [
                {
                  svg: clockIconRaw,
                  width: 10,
                  height: 10,
                  margin: [40, 5, 0, 0],
                },
                {
                  text: str || '-',
                  margin: [43, 0, 0, 0],
                  style: 'whiteColorFilters',
                },
              ],
            },
          ],
          [
            {
              columns: [
                {
                  svg: filterIconRaw,
                  width: 10,
                  height: 10,
                  margin: [40, 6, 0, 0],
                },
                {
                  text: filters || '-',
                  margin: [43, 0, 0, 0],
                  style: 'whiteColorFilters',
                },
              ],
            },
          ],
        ],
      },
      margin: [-40, 0, -40, 0],
      layout: {
        fillColor: () => COLORS.PRIMARY,
        hLineWidth: () => 0,
        vLineWidth: () => 0,
      },
    });

    this.addContent({ text: '\n' });
    this.logger.debug('Time range and filters rendered');
  }
  addVisualizations(visualizations, isAgents, tab) {
    this.logger.debug(`${visualizations.length} visualizations for tab ${tab}`);
    const single_vis = visualizations.filter(item => item.width >= 600);
    const double_vis = visualizations.filter(item => item.width < 600);

    single_vis.forEach(visualization => {
      const title = this.checkTitle(visualization, isAgents, tab);
      this.addContent({
        id: 'singlevis' + title[0]._source.title,
        text: title[0]._source.title,
        style: 'h3',
      });
      this.addContent({
        columns: [{ image: visualization.element, width: 500 }],
      });
      this.addNewLine();
    });

    let pair = [];

    for (const item of double_vis) {
      pair.push(item);
      if (pair.length === 2) {
        const title_1 = this.checkTitle(pair[0], isAgents, tab);
        const title_2 = this.checkTitle(pair[1], isAgents, tab);

        this.addContent({
          columns: [
            {
              id: 'splitvis' + title_1[0]._source.title,
              text: title_1[0]._source.title,
              style: 'h3',
              width: 280,
            },
            {
              id: 'splitvis' + title_2[0]._source.title,
              text: title_2[0]._source.title,
              style: 'h3',
              width: 280,
            },
          ],
        });

        this.addContent({
          columns: [
            { image: pair[0].element, width: 270 },
            { image: pair[1].element, width: 270 },
          ],
        });

        this.addNewLine();
        pair = [];
      }
    }

    if (double_vis.length % 2 !== 0) {
      const item = double_vis[double_vis.length - 1];
      const title = this.checkTitle(item, isAgents, tab);
      this.addContent({
        columns: [
          {
            id: 'splitsinglevis' + title[0]._source.title,
            text: title[0]._source.title,
            style: 'h3',
            width: 280,
          },
        ],
      });
      this.addContent({ columns: [{ image: item.element, width: 280 }] });
      this.addNewLine();
    }
  }
  formatDate(date: Date): string {
    this.logger.debug(`Format date ${date}`);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const str = `${year}-${month < 10 ? '0' + month : month}-${
      day < 10 ? '0' + day : day
    }T${hours < 10 ? '0' + hours : hours}:${
      minutes < 10 ? '0' + minutes : minutes
    }:${seconds < 10 ? '0' + seconds : seconds}`;
    this.logger.debug(`str: ${str}`);
    return str;
  }
  checkTitle(item, isAgents, tab) {
    this.logger.debug(
      `Item ID ${item.id}, from ${
        isAgents ? 'agents' : 'overview'
      } and tab ${tab}`,
    );

    const title = isAgents
      ? AgentsVisualizations[tab].filter(v => v._id === item.id)
      : OverviewVisualizations[tab].filter(v => v._id === item.id);
    return title;
  }

  addSimpleTable({
    columns,
    items,
    title,
  }: {
    columns: { id: string; label: string }[];
    title?: string | { text: string; style: string };
    items: any[];
  }) {
    if (title) {
      this.addContent(
        typeof title === 'string' ? { text: title, style: 'h4' } : title,
      ).addNewLine();
    }

    if (!items || !items.length) {
      this.addContent({
        text: 'No results match your search criteria',
        style: 'standard',
      });
      return this;
    }

    const tableHeader = columns.map(column => {
      return { text: column.label, style: 'whiteColor', border: [0, 0, 0, 0] };
    });

    const tableRows = items.map((item, index) => {
      return columns.map(column => {
        const cellValue = item[column.id];
        return {
          text: typeof cellValue !== 'undefined' ? cellValue : '-',
          style: 'standard',
        };
      });
    });

    // 385 is the max initial width per column
    let totalLength = columns.length - 1;
    const widthColumn = 385 / totalLength;
    let totalWidth = totalLength * widthColumn;

    const widths: number[] = [];

    for (let step = 0; step < columns.length - 1; step++) {
      let columnLength = this.getColumnWidth(columns[step], tableRows, step);

      if (columnLength <= Math.round(totalWidth / totalLength)) {
        widths.push(columnLength);
        totalWidth -= columnLength;
      } else {
        widths.push(Math.round(totalWidth / totalLength));
        totalWidth -= Math.round(totalWidth / totalLength);
      }
      totalLength--;
    }
    widths.push('*');

    this.addContent({
      fontSize: 8,
      table: {
        headerRows: 1,
        widths,
        body: [tableHeader, ...tableRows],
      },
      layout: {
        fillColor: i => (i === 0 ? COLORS.PRIMARY : null),
        hLineColor: () => COLORS.PRIMARY,
        hLineWidth: () => 1,
        vLineWidth: () => 0,
      },
    }).addNewLine();
    return this;
  }

  addList({
    title,
    list,
  }: {
    title: string | { text: string; style: string };
    list: (string | { text: string; style: string })[];
  }) {
    return this.addContentWithNewLine(
      typeof title === 'string' ? { text: title, style: 'h2' } : title,
    )
      .addContent({ ul: list.filter(element => element) })
      .addNewLine();
  }

  addNewLine() {
    return this.addContent({ text: '\n' });
  }

  addContentWithNewLine(title: any) {
    return this.addContent(title).addNewLine();
  }

  addAgentsFilters(agents) {
    this.logger.debug(
      `Started to render the authorized agents filters: agents: ${agents}`,
    );

    this.addNewLine();

    this.addContent({
      text: 'NOTE: This report only includes the authorized agents of the user who generated the report',
      style: { fontSize: 10, color: COLORS.PRIMARY },
      margin: [0, 0, 0, 5],
    });

    /*TODO: This will be enabled by a config*/
    /* this.addContent({
      fontSize: 8,
      table: {
        widths: ['*'],
        body: [
          [
            {
              columns: [
                {
                  svg: filterIconRaw,
                  width: 10,
                  height: 10,
                  margin: [40, 6, 0, 0]
                },
                {
                  text: `Agent IDs: ${agents}` || '-',
                  margin: [43, 0, 0, 0],
                  style: { fontSize: 8, color: '#333' }
                }
              ]
            }
          ]
        ]
      },
      margin: [-40, 0, -40, 0],
      layout: {
        fillColor: () => null,
        hLineWidth: () => 0,
        vLineWidth: () => 0
      }
    }); */

    this.addContent({ text: '\n' });
    this.logger.debug('Time range and filters rendered');
  }

  async print(reportPath: string) {
    return new Promise((resolve, reject) => {
      // Get configuration settings
      Promise.all(
        [
          'customization.logo.reports',
          'customization.reports.header',
          'customization.reports.footer',
        ].map(key => this.configuration.getCustomizationSetting(key)),
      ).then(([pathToLogo, pageHeader, pageFooter]) => {
        try {
          const document = this._printer.createPdfKitDocument({
            ...pageConfiguration({ pathToLogo, pageHeader, pageFooter }),
            content: this._content,
          });

          document.on('error', reject);
          document.on('end', resolve);

          document.pipe(fs.createWriteStream(reportPath));
          document.end();
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Returns the width of a given column
   *
   * @param column
   * @param tableRows
   * @param step
   * @returns {number}
   */
  getColumnWidth(column, tableRows, index) {
    const widthCharacter = 5; //min width per character

    //Get the longest row value
    const maxRowLength = tableRows.reduce((maxLength, row) => {
      return row[index].text.length > maxLength
        ? row[index].text.length
        : maxLength;
    }, 0);

    //Get column name length
    const headerLength = column.label.length;

    //Use the longest to get the column width
    const maxLength = maxRowLength > headerLength ? maxRowLength : headerLength;

    return maxLength * widthCharacter;
  }
}
