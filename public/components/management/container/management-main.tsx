/*
 * Wazuh app - React component for all management section.
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { useEffect } from 'react';
// Redux
import { connect } from 'react-redux';

import { updateRulesetSection } from '../../../redux/actions/rulesetActions';
import ManagementWelcome from '../components/management-welcome';

const WzManagementMain = (props) => {
  useEffect(() => {
    props.updateRulesetSection(props.state.section);
  }, []);

  const ruleset = ['ruleset', 'rules', 'decoders', 'lists'];
  return (
    <>
      <ManagementWelcome />
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    state: state.managementReducers,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    updateRulesetSection: (section) => dispatch(updateRulesetSection(section)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(WzManagementMain);
