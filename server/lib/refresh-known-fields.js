/*
 * Wazuh app - Refresh known fields for all valid index patterns
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { WAZUH_MONITORING_PATTERN } from "../../util/constants";

/**
 * Refresh known fields for all valid index patterns.
 * Optionally forces the default index pattern creation.
 */
export async function checkKnownFields(
  wzWrapper,
  log,
  server,
  defaultIndexPattern,
  quiet = false
) {
  try {
    const usingCredentials = await wzWrapper.usingCredentials();
    const msg = `Security enabled: ${usingCredentials ? 'yes' : 'no'}`;

    !quiet && log('initialize:checkKnownFields', msg, 'debug');

    const indexPatternList = await wzWrapper.getAllIndexPatterns();

    !quiet &&
      log(
        'initialize:checkKnownFields',
        `Found ${indexPatternList.hits.total.value} index patterns`,
        'debug'
      );

    const list = [];
    if (((indexPatternList || {}).hits || {}).hits) {
      const minimum = ['timestamp', 'rule.id', 'manager.name', 'agent.id'];

      if (indexPatternList.hits.hits.length > 0) {
        for (const index of indexPatternList.hits.hits) {
          let valid, parsed;
          try {
            parsed = JSON.parse(index._source['index-pattern'].fields);
          } catch (error) {
            continue;
          }
          valid = parsed.filter(item => minimum.includes(item.name));

          if (valid.length === 4) {
            list.push({
              id: index._id.split('index-pattern:')[1],
              title: index._source['index-pattern'].title,
              namespace: index._source.namespace
            });
          }
        }
      }
    }
    !quiet &&
      log(
        'initialize:checkKnownFields',
        `Found ${list.length} valid index patterns for Wazuh alerts`,
        'debug'
      );

    const defaultExists = list.filter(
      item =>
        item.title === defaultIndexPattern &&
        typeof item.namespace === 'undefined'
    );

    if (defaultIndexPattern && defaultExists.length === 0) {
      !quiet &&
        log(
          'initialize:checkKnownFields',
          `Default index pattern not found, creating it...`,
          'info'
        );

      try {
        await wzWrapper.createIndexPattern(defaultIndexPattern);
      } catch (error) {
        log('initialize:checkKnownFields', error.message || error);
      }

      !quiet &&
        log(
          'initialize:checkKnownFields',
          'Waiting for default index pattern creation to complete...',
          'debug'
        );

      let waitTill = new Date(new Date().getTime() + 0.5 * 1000);
      let tmplist = null;
      while (waitTill > new Date()) {
        tmplist = await wzWrapper.searchIndexPatternById(defaultIndexPattern);
        if (tmplist.hits.total.value >= 1) break;
        else waitTill = new Date(new Date().getTime() + 0.5 * 1000);
      }

      list.push({
        id: tmplist.hits.hits[0]._id.split('index-pattern:')[1],
        title: tmplist.hits.hits[0]._source['index-pattern'].title
      });
    } else {
      !quiet &&
        log(
          'initialize:checkKnownFields',
          `Default index pattern found`,
          'debug'
        );
    }

    for (const item of list) {
      if (
        item.title.includes(WAZUH_MONITORING_PATTERN) ||
        item.id.includes(WAZUH_MONITORING_PATTERN)
      ) {
        continue;
      }
      !quiet &&
        log(
          'initialize:checkKnownFields',
          `Refreshing known fields for "index-pattern:${item.title}"`,
          'debug'
        );
      const prefix = item.namespace
        ? `${item.namespace}:index-pattern:`
        : 'index-pattern:';
      await wzWrapper.updateIndexPatternKnownFields(`${prefix}${item.id}`);
    }

    !quiet && log('initialize', 'App ready to be used.', 'info');
    !quiet && server.log('info', 'Wazuh app ready to be used.');

    return;
  } catch (error) {
    !quiet && log('initialize:checkKnownFields', error.message || error);
    !quiet &&
      server.log(
        'error',
        'Wazuh app had en error importing objects into Elasticsearch.' +
          error.message || error
      );
  }
}
