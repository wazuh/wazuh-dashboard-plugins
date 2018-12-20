/*
 * Wazuh app - Module to update the configuration file
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import fs from 'fs';
import readline from 'readline';
import path from 'path';

export function updateConfigurationFile(req) {
  try {
    const customPath = path.join(__dirname, '../../config.yml');
    const data = fs.createReadStream(customPath);
    const raw = fs.readFileSync(customPath, { encoding: 'utf-8' });
    const rd = readline.createInterface({ input: data, console: false });
    let notFound = true;
    let findedLine = '';
    rd.on('line', function (line) {
      const trimLine = line.replace(/ /g, '');
      if ((trimLine.indexOf(req.payload.key + ':') >= 0
        || trimLine.indexOf('#' + req.payload.key + ':') >= 0)
        && trimLine.indexOf('.' + req.payload.key + ':') === -1) {
        notFound = false;
        findedLine = line.replace(/(\r\n\t|\n|\r\t)/gm, '').trim();
      }
    }).on('close', () => {
      if (notFound) {
        fs.appendFile(customPath, '\r\n' + req.payload.key + ':' + req.payload.value, function (err) {
          if (err) {
            return false;
          }
        })
      } else {
        const result = raw.replace(findedLine, req.payload.key + ' : ' + req.payload.value);
        fs.writeFile(customPath, result, 'utf8', function (err) {
          if (err) {
            return false;
          }
        });
      }
    });
    return true;
  } catch (error) {
    return false;
  }

}
