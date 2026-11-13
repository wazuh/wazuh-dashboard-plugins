import React, { useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiPopover,
  EuiText,
  EuiToolTip,
} from '@elastic/eui';
import type { CveScore } from '../../../../common/cti-explorer/cve-record';
import { getSeverityColor, getSeverityLabel } from './severity-badge';

/** Scores shown in the row; the rest open from "+N more". */
export const CVSS_SCORES_VISIBLE = 3;

/** Highest first; on a tie, the newest CVSS version. */
const byScore = (scores: CveScore[]) =>
  [...scores].sort(
    (a, b) => b.score - a.score || b.version.localeCompare(a.version),
  );

/** Clicks inside the cell must not reach the row, which opens the record. */
const stopPropagation = (event: React.SyntheticEvent) =>
  event.stopPropagation();

const ScoreBadge = ({ score }: { score: CveScore }) => (
  <EuiToolTip
    content={i18n.translate('wazuh.ctiExplorer.cvssScores.tooltip', {
      defaultMessage: '{severity} · CVSS {version} · {source}',
      values: {
        severity: getSeverityLabel(score.severity),
        version: score.version,
        source: score.source,
      },
    })}
  >
    <EuiBadge
      color={getSeverityColor(score.severity)}
      data-test-subj='ctiExplorerCvssScore'
    >
      {score.score.toFixed(1)}
    </EuiBadge>
  </EuiToolTip>
);

/**
 * Every CVSS base score of a record, each colored by its severity. Past
 * {@link CVSS_SCORES_VISIBLE}, the others are listed in a popover, as the
 * groups of the agents table.
 */
export const CvssScores = ({ scores }: { scores: CveScore[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!scores.length) {
    return (
      <EuiText size='s' color='subdued' component='span'>
        -
      </EuiText>
    );
  }
  const sorted = byScore(scores);
  const visible = sorted.slice(0, CVSS_SCORES_VISIBLE);
  const hidden = sorted.slice(CVSS_SCORES_VISIBLE);
  return (
    <EuiFlexGroup
      gutterSize='xs'
      alignItems='center'
      responsive={false}
      wrap
      data-test-subj='ctiExplorerCvssScores'
    >
      {visible.map((score, position) => (
        <EuiFlexItem grow={false} key={position}>
          <ScoreBadge score={score} />
        </EuiFlexItem>
      ))}
      {hidden.length ? (
        <EuiFlexItem grow={false}>
          <EuiPopover
            isOpen={isOpen}
            closePopover={() => setIsOpen(false)}
            panelPaddingSize='s'
            button={
              <EuiLink
                className='eui-textNoWrap'
                onClick={(event: React.MouseEvent) => {
                  event.stopPropagation();
                  setIsOpen(open => !open);
                }}
                data-test-subj='ctiExplorerCvssScoresMore'
              >
                <EuiText size='s' component='span'>
                  {i18n.translate('wazuh.ctiExplorer.cvssScores.more', {
                    defaultMessage: '+{count} more',
                    values: { count: hidden.length },
                  })}
                </EuiText>
              </EuiLink>
            }
          >
            {/* The popover is a portal: its clicks still bubble to the row. */}
            <div onClick={stopPropagation}>
              <EuiFlexGroup
                gutterSize='xs'
                responsive={false}
                wrap
                style={{ maxWidth: 240 }}
                data-test-subj='ctiExplorerCvssScoresHidden'
              >
                {hidden.map((score, position) => (
                  <EuiFlexItem grow={false} key={position}>
                    <ScoreBadge score={score} />
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            </div>
          </EuiPopover>
        </EuiFlexItem>
      ) : null}
    </EuiFlexGroup>
  );
};
