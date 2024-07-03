/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

// @ts-check
// workaround for Safari support before https://github.com/niklasvh/html2canvas/pull/2911 is merged
const https = require('https');
const fs = require('fs');
const replace = require('replace-in-file');

const options = {
  files: [
    __dirname + '/../node_modules/html2canvas/**/*.js',
    __dirname + '/../node_modules/html2canvas/**/*.js.map',
  ],
  from: 'if (image.width === width && image.height === height) {',
  to: 'if (false && image.width === width && image.height === height) {',
};

try {
  const changedFiles = replace.sync(options);
  console.log(
    'Modified files for html2canvas Safari support:\n',
    changedFiles
      .filter((file) => file.hasChanged)
      .map((file) => file.file)
      .join('\n')
  );
} catch (error) {
  console.error(
    'Error occurred when modifiying files for html2canvas Safari support:',
    error
  );
}

// download tesseract model
const modelFile = fs.createWriteStream(__dirname + '/../common/tesseract/eng.traineddata.gz');
https.get(
  'https://raw.githubusercontent.com/naptha/tessdata/gh-pages/4.0.0_best/eng.traineddata.gz',
  function (response) {
    response.pipe(modelFile);
    modelFile.on('finish', () => {
      modelFile.close();
      console.log('Downloaded eng.traineddata.gz for tesseract.js');
    });
  }
);
