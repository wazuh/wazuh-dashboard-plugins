import React, { Component } from 'react';
import {
  EuiFacetButton,
  EuiFlexItem,
  EuiButtonEmpty
} from '@elastic/eui';
import { EuiPopover } from '@elastic/eui';

export class AttkPopover extends Component {
  state: {
    isOpen: boolean
  }
  props!: {
    name: string
    attacksCount: number
    id: string
    addFilter: Function 
    addNegativeFilter: Function
  }

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    }
  }

  render() {
    const {
      attacksCount,
      name,
      addFilter,
      addNegativeFilter,
      id
    } = this.props;
    const { isOpen } = this.state;

    return (
      <EuiPopover
        className="euiButton euiButton--text facet-poc3"
        style={{margin:5, padding: "0px 5px",width:"23%"}}
        button={
          <EuiFacetButton 
          style={{width: "100%"}}
          quantity={attacksCount}
          onClick={() => this.setState({isOpen: !isOpen})} >
          {name}
          </EuiFacetButton>
        } 
        isOpen={isOpen}
        closePopover={() => this.setState({isOpen: !isOpen})} >
                    <EuiButtonEmpty 
              iconType='plusInCircle'
              onClick={() => addFilter(id)} >
                Filter by this
              </EuiButtonEmpty><br />
            <EuiButtonEmpty 
              iconType='minusInCircle'
              onClick={() => addNegativeFilter(id)} >
                Exclude result
              </EuiButtonEmpty><br />
            <EuiButtonEmpty 
              iconType='iInCircle'
              onClick={() => alert(`This Show the info of the ${name}`)} >
                Info
              </EuiButtonEmpty><br />
      </EuiPopover>
      )
  }
}