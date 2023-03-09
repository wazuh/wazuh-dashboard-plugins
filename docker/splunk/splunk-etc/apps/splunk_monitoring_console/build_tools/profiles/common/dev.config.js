/**
 * Development config settings shared by all.
 * If you'd like to use your own settings, you can create 'dev.local.config.js' and that will be
 * used instead of this.
 * @type {Object}
 */

var colors = require('colors');
var ProgressBarPlugin = require('progress-bar-webpack-plugin');
var webpack = require('webpack');
var crypto = require('crypto');

var msgs = [
    'Really loving IT',
    'Flush twice!',
    'Pickup a floater...',
    "What's the latest?",
    'Full flavor!',
    'Ghetto ride!',
    'Birdflu!',
    'Cool cool, sure sure...',
    'HTTP!',
    'Animal style!',
    'Livin the dream!',
    'Rippin it up!',
    'Very marginal...',
    'Take a break!',
    'Very relaxing...',
    'Gonna go leather up',
    'Help a brother out',
    'Very inappropriate',
    'Very refreshing...',
    'Tim Hortons',
    'Old man mode',
    'Keep it simple',
    'Special Guest',
    'Delicious treats',
    'I enjoy a refreshing brew',
    'You love a good web build',
    'Ohh Yeahhh!',
    'Very Bro-laxing!',
    'Ghetto treats!',
    'Dual action!',
    'Black lung',
    'Residual matter',
    'Setup for success!',
    'Hey Len!',
    'Just thowin em back',
];

var progressPlugin = new ProgressBarPlugin({
    format:
        msgs[~~(Math.random() * msgs.length)] +
        ' ' +
        colors.gray('[') +
        colors.blue(':bar') +
        colors.gray(']') +
        ' ' +
        colors.green(':msg'),
});

module.exports = {
    devtool: '#eval-source-map',
    mode: 'development',
    plugins: [
        new webpack.DefinePlugin({
            'process.env.SC_ATTR': JSON.stringify(`core_sc${crypto.randomBytes(8).toString('hex')}`),
        }),
        progressPlugin,
    ],
};
