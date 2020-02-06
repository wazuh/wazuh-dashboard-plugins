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
  }

  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    }
  }

  render() {
    const { attacksCount, name } = this.props;
    const { isOpen } = this.state;

    return (
      <EuiPopover
        className="euiButton euiButton--primary"
        style={{margin:5, padding: "0px 5px"}}
        button={
          <EuiFacetButton 
          style={{width:"300px"}}
          quantity={attacksCount}
          onClick={() => this.setState({isOpen: !isOpen})} >
          {name}
          </EuiFacetButton>
        } 
        isOpen={isOpen}
        closePopover={() => this.setState({isOpen: !isOpen})} >
                    <EuiButtonEmpty 
              iconType='plusInCircle'
              onClick={() => alert(`This set a filter by ${name}`)} >
                Filter by this
              </EuiButtonEmpty><br />
            <EuiButtonEmpty 
              iconType='minusInCircle'
              onClick={() => alert(`This set a negative filter by ${name}`)} >
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