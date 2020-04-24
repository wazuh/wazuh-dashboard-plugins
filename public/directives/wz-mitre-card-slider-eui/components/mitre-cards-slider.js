/*
 * Wazuh app - React component for building a card to be used for showing compliance requirements.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import ReactMarkdown from 'react-markdown';
import PropTypes from 'prop-types';
import {
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexItem,
  EuiFlexGroup,
  EuiFlyout,
  EuiTitle,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiStat,
  EuiPanel,
  EuiLoadingContent,
  EuiLink,
  EuiSpacer,
  EuiDescriptionList,
  EuiToolTip
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
      currentCardData: {},
      isFlyoutVisible: false,
      isSwitchChecked: true
    };
    this.expanded = false;
    this.closeFlyout = this.closeFlyout.bind(this);
    this.showFlyout = this.showFlyout.bind(this);
  }

  async componentDidMount() {
    window.addEventListener('resize', this.updateDimensions);
    this.setState({
      sliderLength: (this.props.items || []).length || 0,
      chunkSize: 6
    });
    this.setState({ slider: this.props.items });
    this.setState({
      sliderInfo: {
        T1021: { name: 'Remote Services' },
        T1040: { name: 'Network Sniffing' },
        T1043: { name: 'Commonly Used Port' },
        T1046: { name: 'Network Service Scanning' },
        T1055: { name: 'Process Injection' },
        T1063: { name: 'Security Software Discovery' },
        T1070: { name: 'Indicator Removal on Host' },
        T1071: { name: 'Standard Application Layer Protocol' },
        T1083: { name: 'File and Directory Discovery' },
        T1089: { name: 'Disabling Security Tools' },
        T1090: { name: 'Connection Proxy' },
        T1093: { name: 'Process Hollowing' },
        T1096: { name: 'NTFS File Attributes' },
        T1098: { name: 'Account Manipulation' },
        T1100: { name: 'Web Shell' },
        T1102: { name: 'Web Service' },
        T1107: { name: 'File Deletion' },
        T1110: { name: 'Brute Force' },
        T1112: { name: 'Modify Registry' },
        T1133: { name: 'External Remote Services' },
        T1169: { name: 'Sudo' },
        T1204: { name: 'User Execution' },
        T1210: { name: 'Exploitation of Remote Services' },
        T1215: { name: 'Kernel Modules and Extensions' },
        T1484: { name: 'Group Policy Modification' },
        T1485: { name: 'Data Destruction' },
        T1489: { name: 'Service Stop' },
        T1492: { name: 'Stored Data Manipulation' },
        T1497: { name: 'Virtualization/Sandbox Evasion' },
        T1529: { name: 'System Shutdown/Reboot' }
      }
    });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions);
  }

  /**
   * Updates the chunk size depending on the window width so we avoid unnecessary scroll
   */
  updateDimensions = () => {
    this.setState({ position: 0 });
    if (window.innerWidth < 1450 && this.state.chunkSize !== 4) {
      this.setState({ chunkSize: 4 });
    }
    if (window.innerWidth >= 1450 && this.state.chunkSize !== 6) {
      this.setState({ chunkSize: 6 });
    } else if (window.innerWidth <= 1050 && this.state.chunkSize !== 2) {
      this.setState({ chunkSize: 2 });
    }
  };

  /**
   * When props are updated, we sort the list depending on the alerts count
   *
   * @param {*} nextProps
   */
  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({ sliderLength: (nextProps.items || []).length || 0 });
    let sliderObject = {};
    (this.state.slider || []).forEach(key => {
      sliderObject[key] = 0;
    });
    const tmpSlider = { ...sliderObject, ...nextProps.attacksCount };
    const sliderSorted = Object.keys(tmpSlider).sort(function(a, b) {
      return tmpSlider[b] - tmpSlider[a];
    });
    this.setState({ slider: sliderSorted, position: 0 });
  }

  /**
   * @param {*} cards - Array of cards to be shown
   */
  buildSlider(cards) {
    const items = cards.map((currentItem, index) => {
      const currentCardData = this.state.sliderInfo[currentItem];
      const tooltipText = `Filter by this attack`;
      const title = `${currentCardData.name ||
        'Attack id: ' + currentCardData.id}`;
      const cardFooterContent = (
        <EuiButtonEmpty
          iconType="iInCircle"
          size="xs"
          className="footer-req wz-margin--10"
          onClick={() => this.showFlyout(currentCardData)}
        >
          {'View details'}
        </EuiButtonEmpty>
      );

      return (
        <EuiFlexItem key={index}>
          <EuiPanel className="wz-padding-bt-5 reqCard">
            <EuiLink onClick={() => this.addFilter(currentCardData.id)}>
              <EuiToolTip position="top" content={tooltipText}>
                <EuiTitle size="s" className="wz-text-truncatable title-pin">
                  <h2>{title}</h2>
                </EuiTitle>
              </EuiToolTip>
            </EuiLink>
            <EuiSpacer size="xs" />
            {this.getDescription(currentCardData, index)}
            <EuiSpacer size="xs" />
            {cardFooterContent}
          </EuiPanel>
        </EuiFlexItem>
      );
    });
    return items;
  }

  /**
   * Filters search by mitre.id
   * @param {*} attackId
   */
  addFilter(attackId) {
    this.props.addFilter(attackId);
  }

  /**
   * Returns the view of the current card data (ID and Total Alerts)
   * @param {*} cardData
   */
  getDescription(cardData, index) {
    return (
      <EuiFlexGroup gutterSize="l" className="requirements-cards">
        <EuiFlexItem>
          <EuiStat title={cardData.id} description="ID" titleSize="s" />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiStat
            title={cardData.count}
            description="Total alerts"
            titleColor="primary"
            titleSize="m"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  /**
   * Loop the whole slider and builds the slider that will be shown -  slider[currentPosition:currentPosition+chunkSize]
   */
  showCards() {
    var cardsToShow = [];
    for (
      var i = this.state.position * this.state.chunkSize;
      i < (this.state.position + 1) * this.state.chunkSize &&
      i < this.state.sliderLength;
      i++
    ) {
      const currentCardId = this.state.slider[i];
      var tmpSliderInfo = this.state.sliderInfo;
      const attackCount = (this.props.attacksCount || {})[currentCardId] || 0;
      if (
        !this.state.sliderInfo[currentCardId] ||
        attackCount !== this.state.sliderInfo[currentCardId].count
      ) {
        //updates count if it has changes (e.g. filters changed)
        const attackName =
          (this.state.sliderInfo[currentCardId] || {}).name || '';
        tmpSliderInfo[currentCardId] = {
          id: currentCardId,
          count: attackCount,
          name: attackName
        };
        this.setState({ sliderInfo: tmpSliderInfo });
      }
      cardsToShow.push(currentCardId);
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
      isSwitchChecked: !this.state.isSwitchChecked
    });
  };

  closeFlyout() {
    this.setState({ isFlyoutVisible: false, currentCardData: {} });
  }

  updateCurrentCardData(currentData) {
    if (currentData) {
      const cardId = currentData.id;

      let cardPhases = currentData.phases;
      if (currentData.phases && Array.isArray(currentData.phases))
        cardPhases = currentData.phases.toString();

      let cardPlatforms = currentData.platforms;
      if (currentData.platforms && Array.isArray(currentData.platforms))
        cardPlatforms = currentData.platforms.toString();

      let cardDataSources = currentData.json.x_mitre_data_sources;
      if (
        currentData.json.x_mitre_data_sources &&
        Array.isArray(currentData.json.x_mitre_data_sources)
      )
        cardDataSources = currentData.json.x_mitre_data_sources.toString();

      const cardDescription = (currentData.json || {}).description;
      const cardName = (currentData.json || {}).name;
      const cardVersion = (currentData.json || {}).x_mitre_version;

      this.setState({
        currentCardData: {
          id: cardId,
          phases: cardPhases,
          platforms: cardPlatforms,
          description: cardDescription,
          name: cardName,
          dataSources: cardDataSources,
          version: cardVersion
        }
      });
    }
  }

  async showFlyout(cardData) {
    this.setState({ isFlyoutVisible: true });
    const result = await this.props.wzReq('GET', '/mitre', {
      q: `id=${cardData.id}`
    });
    const formattedResult =
      (((result || {}).data || {}).data.items || [])[0] || {};
    this.updateCurrentCardData(formattedResult);
  }

  getFlyoutHeader() {
    return (
      <EuiFlyoutHeader hasBorder>
        {(Object.keys(this.state.currentCardData).length === 0 && (
          <div>
            <EuiLoadingContent lines={1} />
          </div>
        )) || (
          <EuiTitle size="m">
            <h2 id="flyoutSmallTitle">{this.state.currentCardData.name}</h2>
          </EuiTitle>
        )}
      </EuiFlyoutHeader>
    );
  }

  getArrayFormatted(arrayText) {
    try {
      const stringText = arrayText.toString();
      const splitString = stringText.split(',');
      const resultString = splitString.join(', ');
      return resultString;
    } catch (err) {
      return arrayText;
    }
  }

  getFlyoutBody() {
    const link = `https://attack.mitre.org/techniques/${this.state.currentCardData.id}/`;

    const formattedDescription = this.state.currentCardData.description ? (
      <ReactMarkdown
        className="wz-markdown-margin"
        source={this.state.currentCardData.description}
      />
    ) : (
      this.state.currentCardData.description
    );
    const data = [
      {
        title: 'Id',
        description: this.state.currentCardData.id
      },
      {
        title: 'Tactic',
        description: this.getArrayFormatted(this.state.currentCardData.phases)
      },
      {
        title: 'Platform',
        description: this.getArrayFormatted(
          this.state.currentCardData.platforms
        )
      },
      {
        title: 'Data sources',
        description: this.getArrayFormatted(
          this.state.currentCardData.dataSources
        )
      },
      {
        title: 'Version',
        description: this.state.currentCardData.version
      },
      {
        title: 'Description',
        description: formattedDescription
      }
    ];
    return (
      <EuiFlyoutBody>
        {(Object.keys(this.state.currentCardData).length === 0 && (
          <div>
            <EuiLoadingContent lines={2} />
            <EuiLoadingContent lines={3} />
          </div>
        )) || (
          <div>
            <EuiDescriptionList listItems={data} />
            <EuiSpacer />
            <p>
              More info:{' '}
              <EuiLink href={link} target="_blank">
                {`MITRE ATT&CK - ${this.state.currentCardData.id}`}
              </EuiLink>
            </p>
          </div>
        )}
      </EuiFlyoutBody>
    );
  }

  render() {
    let flyout;
    if (this.state.isFlyoutVisible) {
      flyout = (
        <EuiFlyout
          className="flyout-no-overlap"
          onClose={this.closeFlyout}
          maxWidth="35%"
          aria-labelledby="flyoutSmallTitle"
        >
          {this.getFlyoutHeader()}
          {this.getFlyoutBody()}
        </EuiFlyout>
      );
    }

    return (
      <div>
        <EuiFlexGroup gutterSize="l">
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
            (this.state.position + 1) * this.state.chunkSize <
              this.state.sliderLength - 1 && (
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
    );
  }
}

MitreCardsSlider.propTypes = {
  items: PropTypes.array,
  attacksCount: PropTypes.object,
  reqTitle: PropTypes.string,
  wzReq: PropTypes.func,
  addFilter: PropTypes.func
};
