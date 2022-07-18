/*
 * Wazuh app - Module for Wazuh reporting routes
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import { WazuhReportingCtrl } from '../controllers';
import Joi from 'joi';

export function WazuhReportingRoutes(server) {
  const ctrl = new WazuhReportingCtrl(server);

  const reportFilenameValidation = Joi.string().regex(/^[\w\-\.]+\.pdf$/).required();

  // Builds a PDF report from multiple PNG images
  server.route({
    method: 'POST',
    path: '/reports',
    handler(req, res) {
      return ctrl.report(req, res);
    },
    options: {
      validate: {
        payload: Joi.object({
          agentID: Joi.string().min(3).regex(/^\d{3,}$/),
          array: Joi.array().items(Joi.any()).required(),
          browserTimezone: Joi.string().required(),
          components: Joi.object().pattern(/^\d+$/, Joi.boolean()),
          filters: Joi.any(),
          // groupID validation by regex:
          // The group name must match the regex: /^[a-zA-Z0-9_\-.%]+$/
          // If we try to create a group whose name includes the % character, the Wazuh API has an error.
          // So, we remove the % character to validate the group for generating group configurtion reports
          // https://github.com/wazuh/wazuh-api/blob/v3.13.4/controllers/agents.js#L802
          // https://github.com/wazuh/wazuh-api/blob/master/helpers/filters.js#L25-L44
          // https://github.com/wazuh/wazuh-api/blob/v3.13.4/helpers/input_validation.js#L26-L28
          groupID: Joi.string().regex(/^[a-zA-Z0-9_\-.]+$/),
          isAgents: Joi.alternatives(
            Joi.boolean(),
            Joi.string().min(3).regex(/^\d{3,}$/)
          ),
          searchBar: Joi.alternatives(
            Joi.boolean(),
            Joi.string().allow('')
          ),
          section: Joi.any().when('tab', { is: Joi.string().valid('overview','agents'), then: Joi.required() }),
          tab: Joi.string().valid('general','fim','aws','pm','audit','sca','ciscat','vuls','mitre','virustotal','docker','osquery','oscap','pci','hipaa','nist','gdpr','tsc', 'agentConfig', 'groupConfig', 'syscollector'),
          tables: Joi.any(),
          time: Joi.alternatives(
            Joi.string().valid(''), 
            Joi.object({
              from: Joi.string().required(),
              to: Joi.string().required()
            })
          )
        })
      }
    }
  });

  // Fetch specific report
  server.route({
    method: 'GET',
    path: '/reports/{name}',
    handler(req, res) {
      return ctrl.getReportByName(req, res);
    },
    options: {
      validate: {
        params: Joi.object({
          name: reportFilenameValidation
        })
      }
    }
  });

  // Delete specific report
  server.route({
    method: 'DELETE',
    path: '/reports/{name}',
    handler(req, res) {
      return ctrl.deleteReportByName(req, res);
    },
    options: {
      validate: {
        params: Joi.object({
          name: reportFilenameValidation
        })
      }
    }
  });

  // Fetch the reports list
  server.route({
    method: 'GET',
    path: '/reports',
    handler(req, res) {
      return ctrl.getReports(req, res);
    }
  });
}
