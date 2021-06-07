/*
 * Wazuh app - React component for showing the Mitre Att&ck intelligence flyout.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React , {useState, useEffect, useRef} from 'react';
import { WzRequest } from '../../../react-services';
import { MitreAttackResources } from './mitre_attack_resources';

import {
  EuiBasicTableColumn,
  EuiButtonIcon,
    EuiFlyout,
    EuiFlyoutHeader,
    EuiOverlayMask,
    EuiTitle,
    EuiText,
    EuiFlexGroup,
    EuiFlyoutBody,
    EuiFlexItem,
    EuiAccordion,
    SortDirection,
    EuiInMemoryTable,
  } from '@elastic/eui';
  import { Markdown } from '../../common/util/markdown'
import { EuiButton } from '@elastic/eui/src/components/button/button';

  const GetFlyoutSubtable = ({name, array, props}) => {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);

    useEffect(() => {
      getValues();
    }, []);
    useEffect(() => {
      getValues();
    }, [array]);

    const getValues = async () => {
      setIsLoading(true);
      // We extract the ids from the subtable and count them in a string for the call that will extract the info
      let namesContatenated = [''];
      let contador = 0;
      array.forEach((element) => {
        //The character limit of a request is 8190, if the characters of our request exceed 8100, we divide said call into several to avoid errors
        if(namesContatenated[contador].length + element.length >= 8100)
          contador++;
        namesContatenated[contador] += element;
        namesContatenated[contador] += ',';
      });
      // We make the call to extract the necessary information from the subtable
      try{
        namesContatenated.forEach(async (nameConcatenated) => {
          const data = await WzRequest.apiReq('GET', `/mitre/${name}?${name.slice(-1) === 's' ? name.substring(0, name.length-1) : name}_ids=${nameConcatenated}`, {});
          setData(((((data || {}).data || {}).data || {}).affected_items || []).map((item) => ({...item, ['references.external_id']: item.references.find(reference => reference.source === 'mitre-attack')?.external_id})));  
        });
      }
      catch (error){
        console.log("Error in Mitre Flyout due to: ", error);
      }
      setIsLoading(false);
    }

    const columns: EuiBasicTableColumn<any>[] = [
      {
        field: 'references.external_id',
        name: 'ID',
        sortable: true,
      },
      {
        field: 'name',
        name: 'Name',
        sortable: true,
      },
      {
        field: 'description',
        name: 'Description',
        sortable: true,
        render: (item) => item ? <Markdown markdown={item} /> : '',
        truncateText: true

      },
    ];

    return (
      <EuiAccordion
        style={{ textDecoration: 'none' }}
        id=''
        className='events-accordion'
        // extraAction={<div style={{ marginBottom: 5 }}><strong>{this.state.totalHits || 0}</strong> hits</div>}
        buttonContent={name.charAt(0).toUpperCase() + name.slice(1)}
        paddingSize='none'
        initialIsOpen={true}>
        <EuiInMemoryTable
          columns={columns}
          items={data}
          loading={isLoading}
          pagination={{ pageSizeOptions: [5, 10, 20] }}
          sorting={{ sort: { field: 'name', direction: SortDirection.DESC } }}
          rowProps={props}
        />
      </EuiAccordion>
    );
  }

    // run this function from an event handler or an effect to execute scroll 

  export const ModuleMitreAttackIntelligenceFlyout = ({details, closeFlyout, tableProps}) => {
    const startReference = useRef(null);
    startReference.current?.scrollIntoView();

    return (
      <EuiOverlayMask
              headerZindexLocation="below"
              onClick= {closeFlyout} >
              <EuiFlyout
                onClose={closeFlyout}
                size="l"
                aria-labelledby={``}
                // maxWidth="70%"
                // className=""
              >
                <EuiFlyoutHeader hasBorder>
                  <EuiTitle size="m">
                    <h2 id="flyoutTitle">Details</h2>
                  </EuiTitle>
                </EuiFlyoutHeader>
                <EuiFlyoutBody>
                  <div ref={startReference}>
                    <EuiFlexGroup>
                      {MitreAttackResources[0].mitreFlyoutHeaderProperties.map(detailProperty => (
                        <EuiFlexItem>
                          <div><strong>{detailProperty.label}</strong></div>
                          <EuiText color='subdued'>{detailProperty.render ? detailProperty.render(details[detailProperty.id]) : details[detailProperty.id]}</EuiText>
                        </EuiFlexItem>
                      ))}
                    </EuiFlexGroup>
                  </div>
                  <EuiFlexGroup>
                    <EuiFlexItem>
                        <div><strong>Description</strong></div>
                        <EuiText color='subdued'>{ details.description ? <Markdown markdown={details.description}/> : ''}</EuiText>
                      </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiFlexGroup>
                    <EuiFlexItem>
                        {MitreAttackResources.filter((item) => details[item.id]).map((item) => 
                          <GetFlyoutSubtable
                            name={item.id}
                            array={details[item.id]}
                            props={tableProps}
                          />
                        )}
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlyoutBody>
              </EuiFlyout>
            </EuiOverlayMask>
    )
  };

