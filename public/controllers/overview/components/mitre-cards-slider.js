/*
 * Wazuh app - React component for building a card to be used for showing compliance requirements.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCard,
  EuiFlexItem,
  EuiFlexGroup,
  EuiFlyout,
  EuiTitle,
  EuiText,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiStat,
  EuiPanel
} from '@elastic/eui';

export class MitreCardsSlider extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chunkSize: 6,
      position: 0,
      slider: [],
      sliderLength: 0,
      sliderInfo: {},
      isFlyoutVisible: false,
      isSwitchChecked: true,
    };
    this.expanded = false;
    this.closeFlyout = this.closeFlyout.bind(this);
    this.showFlyout = this.showFlyout.bind(this);
  }
  
  async componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
    this.setState({ sliderLength: this.props.items.length, chunkSize: 6});
    this.setState({ slider: this.props.items });
    this.setState({ sliderInfo: {
      "T1021": {"name" : "Remote Services"},
      "T1040" : {"name" : "Network Sniffing"},
      "T1043" : {"name" : "Commonly Used Port"} ,
      "T1046" : {"name" : "Network Service Scanning"},
      "T1055" : {"name" : "Process Injection"},
      "T1063" : {"name" : "Security Software Discovery" },
      "T1070" : {"name" : "Indicator Removal on Host"},
      "T1071" : {"name" : "Standard Application Layer Protocol"},
      "T1083" : {"name" : "File and Directory Discovery"},
      "T1089" : {"name" : "Disabling Security Tools"},
      "T1090" : {"name" : "Connection Proxy"},
      "T1093" : {"name" : "Process Hollowing"},
      "T1096" : {"name" : "NTFS File Attributes"},
      "T1098" : {"name" : "Account Manipulation"},
      "T1100" : {"name" : "Web Shell"},
      "T1102" : {"name" : "Web Service"},
      "T1107" : {"name" : "File Deletion"},
      "T1110" : {"name" : "Brute Force"},
      "T1112" : {"name" : "Modify Registry"},
      "T1133" : {"name" : "External Remote Services"},
      "T1169" : {"name" : "Sudo"},
      "T1204" : {"name" : "User Execution"},
      "T1210" : {"name" : "Exploitation of Remote Services"},
      "T1215" : {"name" : "Kernel Modules and Extensions"},
      "T1484" : {"name" : "Group Policy Modification"},
      "T1485" : {"name" : "Data Destruction"},
      "T1489" : {"name" : "Service Stop"},
      "T1492" : {"name" : "Stored Data Manipulation"},
      "T1497" : {"name" : "Virtualization/Sandbox Evasion"},
      "T1529" : {"name" : "System Shutdown/Reboot"}
    } });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  /**
   * Updates the chunk size depending on the window width so we avoid unnecessary scroll
   */
  updateDimensions = () => { 
    if(window.innerWidth < 1300 && this.state.chunkSize !== 4){
      this.setState({chunkSize: 4});
    }
    if(window.innerWidth >= 1300 && this.state.chunkSize !== 6){
      this.setState({chunkSize: 6});
    }else if(window.innerWidth <= 1050 && this.state.chunkSize !== 2){
      this.setState({chunkSize: 2});
    }
  };

  /**
   * When props are updated, we sort the list depending on the alerts count
   * 
   * @param {*} nextProps 
   */
  UNSAFE_componentWillReceiveProps(nextProps) {
    let sliderObject = {}
    this.state.slider.forEach((key) => {
      sliderObject[key] = 0
    })
    const tmpSlider = {...sliderObject, ...nextProps.attacksCount};
    const sliderSorted = Object.keys(tmpSlider).sort(function(a,b){return tmpSlider[b]-tmpSlider[a]});
    this.setState({ slider: sliderSorted, position: 0});
  }
  
  /**
   * @param {*} cards - Array of cards to be shown
   */
  buildSlider(cards) {
    const items = cards.map((currentItem, index) => {
      const currentCardData = this.state.sliderInfo[currentItem];
      const title = `${currentCardData.name || "Attack id: "+currentCardData.id}`;
      const cardFooterContent = (
        <EuiButtonEmpty
          iconType="iInCircle"
          size="xs"
          className="footer-req wz-margin--10"
          onClick={() => this.showFlyout(currentCardData)}
        >
          {"View details"}
        </EuiButtonEmpty>
      );
      
        return (
          <EuiFlexItem key={index}>
            <EuiPanel 
            className="wz-padding-bt-5 reqCard">
              <EuiTitle size="s" className="wz-text-truncatable">
                <h2>{title}</h2>
                </EuiTitle>
            {this.getDescription(currentCardData,index)}
            {cardFooterContent}
            </EuiPanel>
          </EuiFlexItem>
        );
    });
    return items;
  }

  /**
   * Returns the view of the current card data (ID and Total Alerts)
   * @param {*} cardData 
   */
  getDescription(cardData,index){
    return (
      <EuiFlexGroup gutterSize="l" className="requirements-cards">
        <EuiFlexItem >
          <EuiStat title={cardData.id} description="ID" titleSize="s" />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat title={cardData.count} description="Total alerts" titleColor="primary" titleSize="m" />  
        </EuiFlexItem>
      </EuiFlexGroup>
    )
  }

/**
 * Loop the whole slider and builds the slider that will be shown -  slider[currentPosition:currentPosition+chunkSize]
 */
  showCards() {
    var cardsToShow = []
    for(var i=this.state.position*this.state.chunkSize; i < (this.state.position+1)*this.state.chunkSize && i < this.state.sliderLength  ; i++){
      const currentCardId = this.state.slider[i]
      var tmpSliderInfo = this.state.sliderInfo
      const attackCount = (this.props.attacksCount || {})[currentCardId] || 0
      if(!this.state.sliderInfo[currentCardId] || attackCount !== this.state.sliderInfo[currentCardId].count){ //updates count if it has changes (e.g. filters changed)
        const attackName = (this.state.sliderInfo[currentCardId] || {}).name || ""
        tmpSliderInfo[currentCardId] = {id: currentCardId, count: attackCount, name: attackName}
        this.setState({ sliderInfo: tmpSliderInfo });
      }
      cardsToShow.push(currentCardId)
    }
    return this.buildSlider(cardsToShow);
  }



  /**
   * Expands the card to show all info
   */
  expand() {
    this.expanded = !this.expanded;
    this.buildSlider();
  }

  /**
   * Slides to the right the slider
   */
  slideRight() {
    const newPos = this.state.position + 1;
    this.setState({ position: newPos });
  }


  /**
   * Slides to the left the slider
   */
  slideLeft() {
    const newPos = this.state.position - 1;
    this.setState({ position: newPos });
  }

  /**
   * Split an array into smallers array
   * @param {Array} array
   * @param {Number} size
   */
  chunk = (array, size) => {
    const chunked = [];
    for (const item of array) {
      const last = chunked[chunked.length - 1];
      if (!last || last.length === size) {
        chunked.push([item]);
      } else {
        last.push(item);
      }
    }
    return chunked;
  };


  onSwitchChange = () => {
    this.setState({
      isSwitchChecked: !this.state.isSwitchChecked,
    });
  };

  closeFlyout() {
    this.setState({ isFlyoutVisible: false });
  }

  showFlyout(cardData) {
    console.log(cardData) // data of selected card
    // TODO - Request extra data to our API so we can print its data in the flyout
    this.setState({ isFlyoutVisible: true });
  }

  render() {
    let flyout;
    if (this.state.isFlyoutVisible) {
      flyout = (
        // TODO
        <EuiFlyout
          onClose={this.closeFlyout}
          size="s"
          aria-labelledby="flyoutSmallTitle">
          <EuiFlyoutHeader hasBorder>
            <EuiTitle size="s">
              <h2 id="flyoutSmallTitle">Attack id - ?</h2>
            </EuiTitle>
          </EuiFlyoutHeader>
          <EuiFlyoutBody>
            <EuiText>
              <p>
                Description
              </p>
            </EuiText>
          </EuiFlyoutBody>
        </EuiFlyout>
      );
    }
    
    return ( 
      <div>
        <EuiFlexGroup gutterSize="l" >
          {this.state.sliderLength > 1 && this.state.position > 0 && (
            <EuiButtonIcon
              className="wz-margin-left-10"
              iconType="arrowLeft"
              aria-label="Previous"
              onClick={() => this.slideLeft()}
            />
          )}
          
          {this.showCards()}
          
          {this.state.sliderLength > 1 &&
            (this.state.position+1)*this.state.chunkSize < this.state.sliderLength - 1 && (
              <EuiButtonIcon
                className="wz-margin-right-10"
                iconType="arrowRight"
                aria-label="Next"
                onClick={() => this.slideRight()}
              />
            )}
        </EuiFlexGroup>
      
        {flyout}
      </div>
    )
   
  }
}

MitreCardsSlider.propTypes = {
  items: PropTypes.array,
  attacksCount: PropTypes.object,
  reqTitle: PropTypes.string,
  wzReq: PropTypes.func
};

