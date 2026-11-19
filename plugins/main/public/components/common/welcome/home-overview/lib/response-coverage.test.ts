import { computeResponseCoverage } from './response-coverage';
import { SeriousFindings } from '../interfaces/types';

const findings: SeriousFindings = {
  byLevel: { critical: 10, high: 30 },
  rules: [
    { id: 'h1', title: 'High, all unanswered', level: 'high', count: 20 },
    {
      id: 'c1',
      title: 'Critical, partly answered',
      level: 'critical',
      count: 10,
    },
    { id: 'h2', title: 'High, all answered', level: 'high', count: 10 },
  ],
  partial: false,
};

describe('computeResponseCoverage', () => {
  it('joins the findings with the responses that answered them', () => {
    const coverage = computeResponseCoverage(findings, {
      byLevel: { critical: 4, high: 10 },
      byRule: { c1: 4, h2: 10 },
    });
    expect(coverage).toMatchObject({
      total: 40,
      answered: 14,
      unanswered: 26,
      ratio: 14 / 40,
      gapsPartial: false,
    });
    // Critical first, then the most unanswered; fully answered rules drop out.
    expect(coverage.gaps.map(gap => [gap.id, gap.unanswered])).toEqual([
      ['c1', 6],
      ['h1', 20],
    ]);
  });

  it('caps the answers at the totals: a response can answer an older finding', () => {
    const coverage = computeResponseCoverage(findings, {
      byLevel: { critical: 99, high: 30 },
      byRule: { c1: 99, h1: 20, h2: 10 },
    });
    expect(coverage).toMatchObject({
      answered: 40,
      unanswered: 0,
      ratio: 1,
      gaps: [],
    });
  });

  it('has no ratio when there is no critical or high finding', () => {
    const coverage = computeResponseCoverage(
      { byLevel: {}, rules: [], partial: false },
      { byLevel: {}, byRule: {} },
    );
    expect(coverage).toMatchObject({ total: 0, unanswered: 0, gaps: [] });
    expect(coverage.ratio).toBeUndefined();
  });

  it('passes on that the findings search left rules out', () => {
    expect(
      computeResponseCoverage(
        { ...findings, partial: true },
        { byLevel: {}, byRule: {} },
      ).gapsPartial,
    ).toBe(true);
  });
});
