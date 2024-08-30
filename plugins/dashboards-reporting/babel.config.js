/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

module.exports = {
  presets: [
    require('@babel/preset-env', {
      targets: { node: '10' },
    }),
    require('@babel/preset-react'),
    require('@babel/preset-typescript'),
  ],
  plugins: [
    require('@babel/plugin-transform-class-properties'),
    require('@babel/plugin-transform-object-rest-spread'),
    ['@babel/plugin-transform-modules-commonjs', { allowTopLevelThis: true }],
    [require('@babel/plugin-transform-runtime'), { regenerator: true }],
  ],
};
