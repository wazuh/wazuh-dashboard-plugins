import React, { useLayoutEffect, useRef, useState } from 'react';
import { i18n } from '@osd/i18n';
import { EuiButtonEmpty, EuiText } from '@elastic/eui';
import { Markdown } from '../../../../../../../common/util';

// Collapsed height: about 7 lines of small text
const COLLAPSED_HEIGHT = '10.5em';
const FADE = 'linear-gradient(to bottom, black 60%, transparent)';

type TechniqueDescriptionProps = {
  id: string;
  markdown: string;
};

/** The technique description, collapsed to a few lines when it is long. */
export const TechniqueDescription = ({
  id,
  markdown,
}: TechniqueDescriptionProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isLong, setIsLong] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isCollapsed = isLong && !isExpanded;

  useLayoutEffect(() => {
    const content = contentRef.current;
    setIsExpanded(false);
    setIsLong(!!content && content.scrollHeight > content.clientHeight + 1);
  }, [markdown]);

  return (
    <EuiText size='s'>
      <div
        id={id}
        ref={contentRef}
        data-test-subj='technique-description'
        // Reaching a hidden link with the keyboard shows the whole text
        onFocus={() => isCollapsed && setIsExpanded(true)}
        style={
          isExpanded
            ? undefined
            : {
                maxHeight: COLLAPSED_HEIGHT,
                overflow: 'hidden',
                ...(isLong ? { maskImage: FADE, WebkitMaskImage: FADE } : {}),
              }
        }
      >
        <Markdown markdown={markdown} />
      </div>
      {isLong && (
        <EuiButtonEmpty
          size='xs'
          flush='left'
          iconType={isExpanded ? 'arrowUp' : 'arrowDown'}
          aria-expanded={isExpanded}
          aria-controls={id}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded
            ? i18n.translate(
                'wazuh.mitreAttack.techniqueFlyout.details.showLess',
                { defaultMessage: 'Show less' },
              )
            : i18n.translate(
                'wazuh.mitreAttack.techniqueFlyout.details.showFullDescription',
                { defaultMessage: 'Show full description' },
              )}
        </EuiButtonEmpty>
      )}
    </EuiText>
  );
};
