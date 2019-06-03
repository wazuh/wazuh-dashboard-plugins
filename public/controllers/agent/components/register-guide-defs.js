/*
 * Wazuh app - Wazuh Register Agents Component steps texts
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
export const RegisterGuideDefs = {
    rpmText1: 'rpm --import http://packages.wazuh.com/key/GPG-KEY-WAZUH\ncat > /etc/yum.repos.d/wazuh.repo <<\EOF\n[wazuh_repo]\ngpgcheck=1\ngpgkey=https://packages.wazuh.com/key/GPG-KEY-WAZUH\nenabled=1\nname=Wazuh repository\nbaseurl=https://packages.wazuh.com/3.x/yum/\nprotect=1\nEOF',
    debText1: 'apt-get install curl apt-transport-https lsb-release',
    debText2: 'curl -s https://packages.wazuh.com/key/GPG-KEY-WAZUH | apt-key add -',
    debText3: 'echo "deb https://packages.wazuh.com/3.x/apt/ stable main" | tee /etc/apt/sources.list.d/wazuh.list\napt-get update',
};
