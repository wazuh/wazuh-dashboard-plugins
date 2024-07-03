/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  humanReadableDate,
  extractFilename,
  extractFileFormat,
  getFileFormatPrefix,
  addReportsTableContent,
  addReportDefinitionsTableContent,
  removeDuplicatePdfFileFormat,
  readStreamToFile,
  generateReportFromDefinitionId,
  generateReportById,
} from '../main_utils';
import {
  reportDefinitionsTableMockResponse,
  mockReportsTableItems,
  reportTableMockResponse,
  reportDefinitionsTableMockContent,
} from './__utils__/main_utils_test_utils';
import sinon from 'sinon';
import httpClientMock from '../../../../test/httpMockClient';

describe('main_utils tests', () => {
  global.URL.createObjectURL = jest.fn();
  let mockElement = document.createElement('a');
  mockElement.download = 'string';
  mockElement.click = function name() {};
  sinon.stub(document, 'createElement').returns(mockElement);

  test('test humanReadableDate', () => {
    const readableDate = new Date(2018, 11, 24, 10, 33, 30);
    const humanReadable = humanReadableDate(readableDate);

    expect(humanReadable).toBe('Mon Dec 24 2018 @ 10:33:30 AM');
  });

  test('test extractFileName', () => {
    const fullFile = 'test_file_name_extracted_correctly.pdf';
    const fileName = extractFilename(fullFile);

    expect(fileName).toBe('test_file_name_extracted_correctly');
  });

  test('test extractFileFormat', () => {
    const fullFile = 'test_file_format_extracted_correctly.png';
    const fileFormat = extractFileFormat(fullFile);

    expect(fileFormat).toBe('png');
  });

  test('test getFileFormatPrefix', () => {
    const fileFormat = 'pdf';
    const fileFormatPrefix = getFileFormatPrefix(fileFormat);

    expect(fileFormatPrefix).toBe('data:pdf;base64,');
  });

  test('test addReportsTableContent', () => {
    const reportsTableItems = addReportsTableContent(reportTableMockResponse);

    expect(reportsTableItems).toStrictEqual(mockReportsTableItems);
  });

  test('test addReportDefinitionsTableContent', () => {
    const reportDefinitionsTableItems = addReportDefinitionsTableContent(
      reportDefinitionsTableMockResponse
    );

    expect(reportDefinitionsTableItems).toStrictEqual(
      reportDefinitionsTableMockContent
    );
  });

  test('test removeDuplicatePdfFileFormat', () => {
    const duplicateFormat = 'test_duplicate_remove.pdf.pdf';
    const duplicateRemoved = removeDuplicatePdfFileFormat(duplicateFormat);

    expect(duplicateRemoved).toBe('test_duplicate_remove.pdf');
  });

  test('test readStreamToFile csv compile', () => {
    const stream =
      'category,customer_gender\n' +
      'c1,Male\n' +
      'c2,Male\n' +
      'c3,Male\n' +
      'c4,Male\n' +
      'c5,Male';

    const fileFormat = 'csv';
    const fileName = 'test_data_report.csv';
    readStreamToFile(stream, fileFormat, fileName);
  });

  test('test readStreamToFile pdf compile', () => {
    const stream = 'data:pdf;base64,zxvniaorbguw40absdoanlsdf';
    const fileFormat = 'pdf';
    const fileName = 'test_pdf_report.pdf';
    readStreamToFile(stream, fileFormat, fileName);
  });

  test('test generateReport compile', () => {
    const reportDefinitionId = '1';
    generateReportFromDefinitionId(reportDefinitionId, httpClientMock);
  });

  test('test generateReportById compile', () => {
    const reportId = '1';
    const handleSuccessToast = jest.fn();
    const handleErrorToast = jest.fn();
    generateReportById(
      reportId,
      httpClientMock,
      handleSuccessToast,
      handleErrorToast
    );
  });

  test('test generateReportById timeout error handling', async () => {
    expect.assertions(1);
    const reportId = '1';
    const handleSuccessToast = jest.fn();
    const handleErrorToast = jest.fn();
    const handlePermissionsMissingToast = jest.fn();

    httpClientMock.get.mockReturnValue(
      Promise.reject({ body: { statusCode: 503 } })
    );

    await generateReportById(
      reportId,
      httpClientMock,
      handleSuccessToast,
      handleErrorToast,
      handlePermissionsMissingToast
    );
    expect(handleErrorToast).toHaveBeenCalledWith(
      'Error generating report.',
      'Timed out generating report ID 1. Try again later.'
    );
  });
});
