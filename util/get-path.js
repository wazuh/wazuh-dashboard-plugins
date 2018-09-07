/*
 * Wazuh app - Module for getting URL path
 * Copyright (C) 2018 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export function getPath (config) {
    let path = config.url;
    let protocol;
    if (config.url.startsWith("https://")) {
        protocol = "https://";
    } else if (config.url.startsWith("http://")) {
        protocol = "http://";
    }

    if (path.lastIndexOf("/") > protocol.length) {
        path = path.substr(0, path.substr(protocol.length).indexOf("/") + protocol.length) +
            ":" + config.port +
            path.substr(path.substr(protocol.length).indexOf("/") + protocol.length);
    } else {
        path = `${config.url}:${config.port}`;
    }
    return path;
}