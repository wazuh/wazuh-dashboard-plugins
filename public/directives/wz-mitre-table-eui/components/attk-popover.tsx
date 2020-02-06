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
    showEmp: boolean
    style: object
  }
  
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    }
  }

  render() {
    const { name, attacksCount, showEmp, style} = this.props;
    const { isOpen } = this.state;
    return (
      (showEmp || attacksCount > 0) &&
      <EuiFlexItem style={style} > 
        <EuiPopover
          button={
            <div>
              <EuiFacetButton
                style={{maxWidth: 200}}
                onClick={() => this.setState({isOpen: !isOpen})}
                quantity={attacksCount}>
                  {name}
              </EuiFacetButton>
            </div>
          }
          isOpen={isOpen}
          closePopover={() => this.setState({isOpen: !isOpen})}
          >
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
      </EuiFlexItem>
    )
  }

}
