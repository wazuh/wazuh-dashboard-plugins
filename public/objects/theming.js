require('ui/modules').get('app/wazuh', [])
    .config(function ($mdThemingProvider, $mdIconProvider) {
        var wazuhPrimary = {
            '50': '#a4d9ea',
            '100': '#8fd0e5',
            '200': '#7ac8e0',
            '300': '#65bfdc',
            '400': '#51b7d7',
            '500': '#3caed2',
            '600': '#2ea2c7',
            '700': '#2991b2',
            '800': '#24809d',
            '900': '#206f88',
            'A100': '#b8e2ef',
            'A200': '#cdeaf3',
            'A400': '#e2f3f8',
            'A700': '#1b5e74'
        };
        $mdThemingProvider
            .definePalette('wazuhPrimary',
            wazuhPrimary);

        var wazuhAccent = {
            '50': '#6c777f',
            '100': '#78848c',
            '200': '#869198',
            '300': '#949da4',
            '400': '#a1aab0',
            '500': '#afb6bb',
            '600': '#cbd0d3',
            '700': '#d9dcde',
            '800': '#e6e9ea',
            '900': '#f4f5f6',
            'A100': '#cbd0d3',
            'A200': '#bdc3c7',
            'A400': '#afb6bb',
            'A700': '#ffffff'
        };
        $mdThemingProvider
            .definePalette('wazuhAccent',
            wazuhAccent);

        var wazuhWarn = {
            '50': '#ff9853',
            '100': '#ff883a',
            '200': '#ff7920',
            '300': '#ff6a07',
            '400': '#ec5e00',
            '500': '#d35400',
            '600': '#b94a00',
            '700': '#a04000',
            '800': '#863600',
            '900': '#6d2b00',
            'A100': '#ffa76d',
            'A200': '#ffb686',
            'A400': '#ffc6a0',
            'A700': '#532100'
        };
        $mdThemingProvider
            .definePalette('wazuhWarn',
            wazuhWarn);

        var wazuhBackground = {
            '50': '#ffffff',
            '100': '#ffffff',
            '200': '#ffffff',
            '300': '#ffffff',
            '400': '#fbfcfc',
            '500': '#ecf0f1',
            '600': '#dde4e6',
            '700': '#cfd9db',
            '800': '#c0cdd1',
            '900': '#b1c2c6',
            'A100': '#ffffff',
            'A200': '#ffffff',
            'A400': '#ffffff',
            'A700': '#a3b6bb'
        };
        $mdThemingProvider
            .definePalette('wazuhBackground',
            wazuhBackground);

        $mdThemingProvider.theme('default')
            .primaryPalette('wazuhPrimary')
            .accentPalette('wazuhAccent')
            .warnPalette('wazuhWarn')
            .backgroundPalette('wazuhBackground')
    });