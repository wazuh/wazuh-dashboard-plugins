import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiCard, EuiFlexItem, EuiFlexGroup } from '@elastic/eui';

export class RequirementeCard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      position: 0,
      carrusel: []
    };
  }

  buildCarrusel() {
    if (this.state.carrusel.length) return;
    const items = this.props.items.map((req, index) => {
      const title = `HIPAA Requirement: ${req.title}`;
      return (
        <EuiFlexItem key={index}>
          <EuiCard
            layout="horizontal"
            title={title}
            description={req.content}
            onClick={() => this.updatePosition()}
          />
        </EuiFlexItem>
      );
    });
    const carrusel = this.chunk(items, 4);
    this.setState({carrusel: carrusel, carruselLength: carrusel.length});
  }

  /**
   * Updates the position to render the others requirements
   */
  updatePosition() {
    const currentPosition = this.state.position;
    let newPos = currentPosition + 1;
    if (newPos >= this.state.carruselLength) newPos = 0;
    this.setState({position: newPos});
  }


  /**
   * Split an array into smallers array
   * @param {Array} array 
   * @param {Number} size
   */
  chunk(array, size) {
    const chunked = [];
    for (let i = 0; i < array.length; i++) {
      const last = chunked[chunked.length - 1];
      if (!last || last.length === size) {
        chunked.push([array[i]]);
      } else {
        last.push(array[i]);
      }
    }
    return chunked;
  }

  render() {
    this.buildCarrusel();
    const cards = this.state.carrusel[this.state.position];
    return (
      <div>
        <EuiFlexGroup gutterSize="l">
          {cards}
        </EuiFlexGroup>
      </div >
    );
  }
}

RequirementeCard.propTypes = {
  items: PropTypes.array
};
