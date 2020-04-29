import React, { Component } from 'react';
import { Inventory } from './index';
import '../../common/modules/module.less';

export class MainFim extends Component {
  constructor(props) {
    super(props);
  }


  render() {
    const { selectView } = this.props;
    if (selectView) {
      return (
        <div>
          {selectView === 'inventory' &&
            <Inventory {...this.props}
            />}
        </div>
      );
    } else {
      return false;
    }
  }
}
