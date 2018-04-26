/*
 * Wazuh app - File for data handler factory definitions
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import * as modules from 'ui/modules'

const app = modules.get('app/wazuh', []);

/**
 * Main function to build a data handler factory.
 * @param {*} DataHandler
 * @param {*} path
 */
const compose = (DataHandler, path) => {
    let dataHandler = new DataHandler();
    dataHandler.path = path;
    return dataHandler;
};

const groups = DataHandler => compose(DataHandler, '/agents/groups');
const agents = DataHandler => compose(DataHandler, '/agents');
const logs = DataHandler => compose(DataHandler, '/manager/logs');
const rules = DataHandler => compose(DataHandler, '/rules');
const decoders = DataHandler => compose(DataHandler, '/decoders');
const simple = DataHandler => new DataHandler();

app
    .factory('Groups', groups)
    .factory('GroupAgents', simple)
    .factory('GroupFiles', simple)
    .factory('AgentsAutoComplete', agents)
    .factory('Agents', agents)
    .factory('Logs', logs)
    .factory('Rules', rules)
    .factory('RulesRelated', rules)
    .factory('RulesAutoComplete', rules)
    .factory('Decoders', decoders)
    .factory('DecodersRelated', simple)
    .factory('DecodersAutoComplete', decoders)
    .directive('lazyLoadData', function($compile) {
        return {
            link: (scope, el, attrs) => {
                let now = new Date().getTime();
                let rep = angular.element(document.getElementsByClassName('md-virtual-repeat-scroller'));
                rep.on('scroll', evt => {
                    if (rep[0].scrollTop + rep[0].offsetHeight >= rep[0].scrollHeight)
                        if (new Date().getTime() - now > 100) {
                            now = new Date().getTime();
                            scope.$apply(() => scope.$eval(attrs.lazyLoadData));
                        }
                });
            }
        };
    });
