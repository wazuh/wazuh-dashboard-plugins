/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component } from 'react';
import {
	EuiLoadingSpinner,
	EuiToolTip
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';

export class CheckUpgrade extends Component {
	props!: {
		id: String,
		version: String
		agent: Object,
		upgrading: Boolean,
		managerVersion: String,
		changeStatusUpdate: Function,
		reloadAgent: Function,
	};
	interval: any;

	constructor(props) {
		super(props);
	}

	componentWillUnmount() {
		clearInterval(this.interval);
	}

	componentDidUpdate(prevProps) {
		if (prevProps.upgrading !== this.props.upgrading) {
			if (this.props.upgrading === true)
			this.interval = setInterval(() => this.checkUpgrade(this.props.id), 3000);
		}
	}

	checkUpgrade(agentId) {
		WzRequest.apiReq('GET', `/agents/${agentId}/upgrade_result`, {}).then(value => {
			if (value.status === 200) {
				this.props.changeStatusUpdate(agentId);
				this.props.reloadAgent();
				clearInterval(this.interval);
				console.log(`${this.props.id} agente termina intervalo`);
			}
		})
		.catch((error) => {
			console.log(error);
		});
	};

	addUpgraingProgress() {
		const { id, version, upgrading, managerVersion } = this.props;

		if (version === '.' || version === managerVersion) {
			return;
		} else if (upgrading === true) {
			/* this.interval = setInterval(() => this.checkUpgrade(id), 30000); */
			return (
				<EuiToolTip content="This agent is being updated." position="right">
					<EuiLoadingSpinner size="s" />
				</EuiToolTip>
			)
		}
	};

	render() {
		const { version } = this.props;
		let upgrading = this.addUpgraingProgress();

		return (
			<div>
				{version}
				&nbsp;
				{upgrading}
			</div>
		)
	}
}