# Comment Test Coverage from a json-summary file

A GitHub action to comment on a PR on GitHub with a simple test coverage summary table that edits itself on successive pushes to the same PR.

## How to use with Karma + Angular

1. Add `"codeCoverage": true,` under test > options in angular.json
2. In your karma.conf.js set coverageIstanbulReporter.reports to include `json-summary` and save it to the /coverage directory if using the sample setup below
3. Use in your workflow as illustrated below:

```yml
name: test-pull-request
on: [pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v1

      - name: Run Jasmine tests
        run: npm run test -- --no-watch --no-progress --browsers=ChromeHeadlessCI

      - name: Comment Test Coverage
        uses: lucianogorza/comment-test-coverage@1.0.3
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          path: coverage/coverage-summary.json
          title: Karma Test Coverage
```

## How to use with Jest

1. Add `"codeCoverage": true,` under test > options in angular.json
2. In your jest.config.js set coverageReporters to include `json-summary` and set coverageDirectory to 'coverage' if using the path in the sample setup above.
3. Use in your workflow as illustrated above in the Karma example.

## Parameters

- `token` (**required**) - The GitHub authentication token (workflows automatically set this for you, nothing needed here)
- `path` (**required**) - Path to your coverage-summary.json file
- `title` (**optional**) - Title of comment in PR (defaults to "Test Coverage")

## How to edit the action

Feel free to submit a PR to this repo and ask me to update the action, but if you'd like to create your own action:

1. Clone down repo, `npm install`, and make changes
2. Run `npm run package`
3. Commit changes
4. Create a new release on GitHub to publish latest version of the action. See https://help.github.com/en/actions/building-actions/publishing-actions-in-github-marketplace

## License

Repurposed from https://github.com/AthleticNet/comment-test-coverage, Copyright (c) 2021 AthleticNet
Repurposed from https://github.com/peter-evans/commit-comment, Copyright (c) 2019 Peter Evans and https://github.com/mshick/add-pr-comment, Copyright (c) 2019 Michael Shick
