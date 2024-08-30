/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { ResponseError } from '@opensearch-project/opensearch/lib/errors';
import fs from 'fs';
import path from 'path';
import {
  IOpenSearchDashboardsResponse,
  IRouter,
} from '../../../../src/core/server';
import { API_PREFIX } from '../../common';
import { errorResponse } from './utils/helpers';

/**
 * Tesseract.js by default uses CDN to host resources needed to spawn workers
 * (https://github.com/naptha/tesseract.js/blob/028a44f/docs/local-installation.md).
 * OSD does not allow the CDN scripts unless user defines `csp.rules` in
 * `opensearch_dashboards.yml` as `"script-src 'unsafe-eval' 'self'
 * https://unpkg.com https://tessdata.projectnaptha.com"`.
 *
 * These routes are used to mimic the CDN. Currently only english traineddata is
 * included and supported.
 */
export default function (router: IRouter) {
  router.get(
    {
      path: `${API_PREFIX}/tesseract.js/dist/worker.min.js`,
      validate: false,
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      //@ts-ignore
      const logger: Logger = context.reporting_plugin.logger;
      try {
        const filePath = path.join(
          __dirname,
          '..',
          '..',
          'node_modules',
          'tesseract.js',
          'dist',
          'worker.min.js'
        );
        const fileContent = await fs.promises
          .readFile(filePath)
          .then((file) => file.toString());
        return response.custom<string>({
          body: fileContent,
          headers: { 'Content-Type': 'application/javascript' },
          statusCode: 200,
        });
      } catch (error) {
        logger.error(`failed during get tesseract.js worker file: ${error}`);
        return errorResponse(response, error);
      }
    }
  );
  router.get(
    {
      path: `${API_PREFIX}/tesseract.js-core/tesseract-core.wasm.js`,
      validate: false,
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      //@ts-ignore
      const logger: Logger = context.reporting_plugin.logger;
      try {
        const filePath = path.join(
          __dirname,
          '..',
          '..',
          'node_modules',
          'tesseract.js-core',
          'tesseract-core.wasm.js'
        );
        const fileContent = await fs.promises
          .readFile(filePath)
          .then((file) => file.toString());
        return response.custom<string>({
          body: fileContent,
          headers: {
            'Content-Type': 'application/javascript',
          },
          statusCode: 200,
        });
      } catch (error) {
        logger.error(`failed during get tesseract.js-core wasm file: ${error}`);
        return errorResponse(response, error);
      }
    }
  );
  router.get(
    {
      path: `${API_PREFIX}/tesseract-lang-data/eng.traineddata.gz`,
      validate: false,
    },
    async (
      context,
      request,
      response
    ): Promise<IOpenSearchDashboardsResponse<any | ResponseError>> => {
      //@ts-ignore
      const logger: Logger = context.reporting_plugin.logger;
      try {
        const filePath = path.join(
          __dirname,
          '..',
          '..',
          'common',
          'tesseract',
          'eng.traineddata.gz'
        );
        const file = await fs.promises.readFile(filePath);
        return response.custom<Buffer>({
          body: file,
          headers: {
            'Content-Type': 'application/gzip',
          },
          statusCode: 200,
        });
      } catch (error) {
        logger.error(
          `failed during get tesseract.js eng.traineddata file: ${error}`
        );
        return errorResponse(response, error);
      }
    }
  );
}
