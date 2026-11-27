/*
 * Wazuh app - React component for building the status view
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React from 'react';
import PropTypes from 'prop-types';
import { EuiPanel } from '@elastic/eui';
import { connect } from 'react-redux';
import { DaemonReadiness } from '../../../../../components/server-readiness';

export const WzStatusDaemons = ({ state }) => (
  <EuiPanel>
    <DaemonReadiness
      node={Object.fromEntries(
        state.listDaemons.map(({ key, value }) => [key, value]),
      )}
    />
  </EuiPanel>
);

WzStatusDaemons.propTypes = {
  state: PropTypes.shape({
    listDaemons: PropTypes.arrayOf(
      PropTypes.shape({ key: PropTypes.string, value: PropTypes.any }),
    ).isRequired,
  }).isRequired,
};

const mapStateToProps = state => {
  return {
    state: state.statusReducers,
  };
};

export default connect(mapStateToProps)(WzStatusDaemons);
