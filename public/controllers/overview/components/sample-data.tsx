/*
 * Wazuh app - React component for show search and filter
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Component, Fragment } from 'react';
import {
	EuiFlexItem,
	EuiCard,
	EuiSpacer,
	EuiFlexGrid
} from '@elastic/eui';

export class SampleData extends Component {
	render() {
		return(
			<Fragment>
				<EuiSpacer />
					<EuiFlexGrid columns={3}>
						<EuiFlexItem key={1}>
							<EuiCard
								layout="horizontal"
								title={'Example'}
								description={'Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque, quas enim! Commodi, obcaecati quis ea ducimus vel reprehenderit, dolor distinctio quaerat, dignissimos voluptas officiis autem est quasi nemo voluptatum tempora.'}
								onClick={() => console.log('L')}
							/>
						</EuiFlexItem>
						<EuiFlexItem key={1}>
							<EuiCard
								layout="horizontal"
								title={'Example'}
								description={'Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque, quas enim! Commodi, obcaecati quis ea ducimus vel reprehenderit, dolor distinctio quaerat, dignissimos voluptas officiis autem est quasi nemo voluptatum tempora.'}
								onClick={() => console.log('L')}
							/>
						</EuiFlexItem>
						<EuiFlexItem key={1}>
							<EuiCard
								layout="horizontal"
								title={'Example'}
								description={'Lorem ipsum dolor sit amet consectetur adipisicing elit. Neque, quas enim! Commodi, obcaecati quis ea ducimus vel reprehenderit, dolor distinctio quaerat, dignissimos voluptas officiis autem est quasi nemo voluptatum tempora.'}
								onClick={() => console.log('L')}
							/>
						</EuiFlexItem>
				</EuiFlexGrid>
			</Fragment>
		)
	}
}