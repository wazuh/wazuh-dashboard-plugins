import React, { Component, Fragment } from "react";
import Proptypes from "prop-types";

import {
  
} from "@elastic/eui";

import WzConfigurationTabSelector from '../util-components/configuration-settings-tab-selector';
import WzConfigurationListSelector from '../util-components/configuration-settings-list-selector';
import WzNoConfig from '../util-components/no-config';
import { settingsListBuilder } from '../utils/builders';
import helpLinks from './help-links';

const renderOptsIncludes = (key) => (item) => item.includes(key) ? 'yes' : 'no';

const mainSettings = [
  { key: 'dir', text: 'Selected item' },
  { key: 'opts', text: 'Enable realtime monitoring', render: renderOptsIncludes('realtime') },
  { key: 'opts', text: 'Enable auditing (who-data)', render: renderOptsIncludes('check_whodata') },
  { key: 'opts', text: 'Report file changes', render: renderOptsIncludes('report_changes') },
  { key: 'opts', text: 'Perform all checksums', render: renderOptsIncludes('check_all') },
  { key: 'opts', text: 'Check sums (MD5 & SHA1)', render: renderOptsIncludes('check_sum') },
  { key: 'opts', text: 'Check MD5 sum', render: renderOptsIncludes('check_md5sum') },
  { key: 'opts', text: 'Check SHA1 sum', render: renderOptsIncludes('check_sha1sum') },
  { key: 'opts', text: 'Check SHA256 sum', render: renderOptsIncludes('check_sha256sum') },
  { key: 'opts', text: 'Check files size', render: renderOptsIncludes('check_size') },
  { key: 'opts', text: 'Check files owner', render: renderOptsIncludes('check_owner') },
  { key: 'opts', text: 'Check files groups', render: renderOptsIncludes('check_group') },
  { key: 'opts', text: 'Check files permissions', render: renderOptsIncludes('check_perm') },
  { key: 'opts', text: 'Check files modification time', render: renderOptsIncludes('check_mtime') },
  { key: 'opts', text: 'Check files inodes', render: renderOptsIncludes('check_inode') },
  { key: 'restrict', text: 'Restrict to files containing this string' },
  { key: 'tags', text: 'Custom tags for alerts' },
  { key: 'recursion_level', text: 'Recursion level' },
  { key: 'opts', text: 'Follow symbolic link', render: renderOptsIncludes('follow_symbolic_link') }
];

class WzConfigurationIntegrityMonitoringMonitored extends Component{
  constructor(props){
    super(props);
  }
  render(){
    const { currentConfig } = this.props;
    const items = settingsListBuilder(currentConfig['syscheck-syscheck'].syscheck.directories, 'dir')
    return (
      <Fragment>
        {currentConfig && currentConfig['syscheck-syscheck'] && currentConfig['syscheck-syscheck'].syscheck && currentConfig['syscheck-syscheck'].syscheck.directories && !currentConfig['syscheck-syscheck'].syscheck.directories.length ? (
          <WzNoConfig error='not-present' help={helpLinks}/>
        ) : null}
        {currentConfig && currentConfig['syscheck-syscheck'] && currentConfig['syscheck-syscheck'].syscheck && currentConfig['syscheck-syscheck'].syscheck.directories && currentConfig['syscheck-syscheck'].syscheck.directories.length ? (
          <WzConfigurationTabSelector
            title='Monitored directories'
            description='These directories are included on the integrity scan'
            currentConfig={currentConfig}
            helpLinks={helpLinks}>
              <WzConfigurationListSelector
                items={items}
                settings={mainSettings}
              />
            </WzConfigurationTabSelector>
        ) : null}
      </Fragment>
    )
  }
}

export default WzConfigurationIntegrityMonitoringMonitored;