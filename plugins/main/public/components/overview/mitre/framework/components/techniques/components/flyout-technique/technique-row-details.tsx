import React, { useState, useEffect } from 'react';
import { EuiCodeBlock, EuiFlexGroup, EuiTabbedContent, EuiFlexItem } from '@elastic/eui';
import { useDocViewer } from '../../../../../../../common/doc-viewer/use-doc-viewer';
import DocViewer from '../../../../../../../common/doc-viewer/doc-viewer';
import RuleDetails from '../rule-details';
import { IndexPattern } from '../../../../../../../../../../../src/plugins/data/common';
import { WzRequest } from '../../../../../../../../react-services/wz-request';

type Props = {
  doc: any;
  item: any;
  indexPattern: IndexPattern;
  onRuleItemClick?: (value: any, indexPattern: IndexPattern) => void;
};

const TechniqueRowDetails = ({ doc, item, indexPattern, onRuleItemClick }) => {
  const docViewerProps = useDocViewer({
    doc,
    indexPattern: indexPattern as IndexPattern,
  });

  const [ruleData, setRuleData] = useState({});

  const getRuleData = async () => {
    const params = { q: `id=${item.rule.id}` };
    const rulesDataResponse = await WzRequest.apiReq('GET', `/rules`, { params });
    const ruleData = ((rulesDataResponse.data || {}).data || {}).affected_items[0] || {};
    setRuleData(ruleData);
  };

  const onAddFilter = (filter: { [key: string]: string }) => {
    onRuleItemClick(filter, indexPattern);
  };

  useEffect(() => {
    getRuleData();
  }, []);

  return (
    <EuiFlexGroup style={{ margin: '-8px' }}>
      <EuiTabbedContent
        style={{ width: '100%' }}
        tabs={[
          {
            id: 'table',
            name: 'Table',
            content: (
              <>
                <DocViewer {...docViewerProps} />
              </>
            ),
          },
          {
            id: 'json',
            name: 'JSON',
            content: (
              <EuiCodeBlock
                aria-label={'Document details'}
                language="json"
                isCopyable
                paddingSize="s"
              >
                {JSON.stringify(item, null, 2)}
              </EuiCodeBlock>
            ),
          },
          {
            id: 'rule',
            name: 'Rule',
            content: <RuleDetails data={ruleData} onClick={onAddFilter} />,
          },
        ]}
      />
    </EuiFlexGroup>
  );
};

export default TechniqueRowDetails;
