# Generating the compliance requirement definitions

`generate-compliance-data.js` writes the files in
`common/compliance-requirements/` from the compliance catalogs of
[`wazuh/intelligence-data`](https://github.com/wazuh/intelligence-data), under
`compliance-catalogs/`. The files are generated: edit the catalog, not them.

## Access

`intelligence-data` is private. The script needs a token with read access:

```bash
export GITHUB_TOKEN=<token>   # or GH_TOKEN, or an authenticated `gh` CLI
```

Without a token, point the script at a local checkout instead:

```bash
node scripts/generate-compliance-data.js --output file \
  --output-directory common/compliance-requirements \
  --catalog-directory ../../../intelligence-data/compliance-catalogs
```

## Usage

```bash
yarn generate:compliance-data   # regenerate every framework
yarn check:compliance-data      # fail when the committed files are out of date
node scripts/generate-compliance-data.js --help
```

## What a catalog contributes

Every control of a catalog becomes one entry, keyed by the identifier the
standard itself uses (`A.5.1`, `164.308(a)(1)(ii)(A)`, `Article 32`):

```ts
export const tscRequirementsFile: Record<string, ComplianceRequirement> = {
  'CC1.1': { title: 'COSO Principle 1: …' },
};
```

`title` is the control name or requirement statement, verbatim from the source.
`description` is the control text beyond the title, and only exists for the
frameworks whose publisher provides one: for PCI DSS, TSC, CMMC and
NIST 800-171 the title already is the full official text. The plugin composes
the two with `getRequirementText` (`common/compliance-requirements/requirement-text.ts`).

A catalog's top-level `aliases` map bridges the compliance tag values the Wazuh
ruleset emits to control identifiers, for the frameworks where the two
notations differ (currently GDPR, HIPAA and CMMC). Each alias becomes an extra
key resolving to the same requirement, so both notations work.

## Checking the ruleset against the catalogs

`--ruleset-directory` reads a `ruleset/sca` directory of a `wazuh/wazuh`
checkout and reports, per framework, the compliance tag values that neither a
control identifier nor an alias resolves. Those findings belong either to the
ruleset (a tag naming something the standard does not define) or to the catalog
(a missing alias):

```bash
node scripts/generate-compliance-data.js --check \
  --output-directory common/compliance-requirements \
  --ruleset-directory ../../../wazuh/ruleset/sca
```

To audit the other direction — the codes a live deployment actually indexes —
use `audit-compliance-requirements.js`.
