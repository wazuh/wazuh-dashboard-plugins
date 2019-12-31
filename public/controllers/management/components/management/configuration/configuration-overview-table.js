import React, { Component, Fragment } from 'react';

import {
	EuiTable,
	EuiTableHeader,
	EuiTableHeaderCell,
	EuiTableBody,
	EuiTableRow,
	EuiTableRowCell,
	EuiSpacer,
	EuiTitle
} from '@elastic/eui';

class WzConfigurationOverviewTable extends Component{
	constructor(props){
		super(props);
	}
	render(){
		const { title, items, columns, onClick } = this.props;
		return (
			<Fragment>
				<EuiTitle size='s'><h2>{title}</h2></EuiTitle>
				<EuiSpacer size='s'/>
				<EuiTable>
					<EuiTableHeader>
						{columns.map((column, key) => (
							<EuiTableHeaderCell key={`${title}-${column.name}`}>{column.name}</EuiTableHeaderCell>
						))}
					</EuiTableHeader>
          <EuiTableBody>
						{items.map((item, key) => (
							<EuiTableRow key={`${title}-row-${key}`} onClick={() => onClick(item.goto)}>
								{columns.map(column => column.field)
									.map(field => (
										<EuiTableRowCell key={`${item[field]}`}>
											{item[field]}
										</EuiTableRowCell>
									))}
							</EuiTableRow>
						))}	
					</EuiTableBody>
        </EuiTable>
				<EuiSpacer/>
			</Fragment>
		)
	}
};

export default WzConfigurationOverviewTable;