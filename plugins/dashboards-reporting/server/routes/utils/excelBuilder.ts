import ExcelJS from 'exceljs';

export class ExcelBuilder {
  constructor() {
    this.workbook = new ExcelJS.Workbook();
    this.worksheet = this.workbook.addWorksheet('Sheet1');
    this.headerRowsCount = 0;
  }

  addHeaders(json: any) {
    if (!json || json.length <= 0) {
      return this;
    }

    const headerKeys: any = this.getHeaderKeys(json);
    this.worksheet.columns = Object.keys(headerKeys).map((key) => {
      return {
        header: [key],
        key,
      };
    });
    this.headerRowsCount++;

    return this;
  }

  addRows(json: any) {
    if (!json || json.length <= 0) {
      return this;
    }

    for (const data of json) {
      this.worksheet.addRow(data);
    }

    return this;
  }

  updateColumnWidths() {
    for (const column of this.worksheet.columns) {
      if (!column.eachCell) {
        continue;
      }

      let maxLength = 0;
      let count = 1;

      column.eachCell({ includeEmpty: true }, (cell) => {
        if (count > this.headerRowsCount) {
          const cellLength = cell.value ? cell.value.toString().length : 0;
          if (cellLength > maxLength) {
            maxLength = cellLength;
          }
        }

        count++;
      });

      column.width = this.getColumnWidth(maxLength);
    }

    return this;
  }

  applyFreeze() {
    this.worksheet.views = [{ state: 'frozen', ySplit: this.headerRowsCount }];

    return this;
  }

  applyHeaderStyles() {
    for (let i = 1; i <= this.headerRowsCount; i++) {
      const row = this.worksheet.getRow(i);

      row.height = this.worksheet.properties.defaultRowHeight * 2;
      row.font = {
        bold: true,
      };
      row.alignment = {
        horizontal: 'left',
        vertical: 'top',
        wrapText: true,
      };
    }

    return this;
  }

  applyAutoFilter() {
    const row = this.worksheet.getRow(this.headerRowsCount);
    const firstCell = row.getCell(1);

    let lastCell = firstCell;
    row.eachCell({ includeEmpty: true }, function (cell) {
      lastCell = cell;
    });

    this.worksheet.autoFilter = {
      from: firstCell.$col$row,
      to: lastCell.$col$row,
    };

    return this;
  }

  async getWorkbookAsBase64() {
    const buffer = await this.workbook.xlsx.writeBuffer();
    const base64 = buffer.toString('base64');

    return base64;
  }

  getColumnWidth(length: number): number {
    if (length <= 13) {
      return 15;
    }

    if (length <= 18) {
      return 20;
    }

    return 25;
  }

  getHeaderKeys(json: any) {
    const headerKeys: any = {};

    for (const data of json) {
      for (const key of Object.keys(data)) {
        if (!headerKeys[key]) {
          headerKeys[key] = true;
        }
      }
    }

    return headerKeys;
  }

  workbook: ExcelJS.Workbook;
  worksheet: ExcelJS.Worksheet;

  headerRowsCount: number;
}
