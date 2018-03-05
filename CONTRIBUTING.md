# Contributing to the Wazuh app

This document describes the proper way to contribute to the Wazuh app for Kibana. **Please read our contributing guidelines carefully** so that you spend less time, overall, struggling to push your PR through our code review processes.

At the same time, this document briefs the proper method to post **new issues** to the repository, which helps us a lot to have them organized, reviewed and solved as soon as possible.

## Table of Contents

- [Effective issue reporting in the Wazuh app repository](#effective-issue-reporting-in-the-wazuh-app-repository)
    - [Voicing the importance of an issue](#voicing-the-importance-of-an-issue)
    - ["My issue isn't getting enough attention"](#my-issue-isnt-getting-enough-attention)
    - ["I want to help!"](#i-want-to-help)
- [How We Use Git and GitHub](#how-we-use-git-and-github)
    - [Branching](#branching)
    - [Commits and Merging](#commits-and-merging)
        - [Rebasing and fixing merge conflicts](#rebasing-and-fixing-merge-conflicts)
    - [What Goes Into a Pull Request](#what-goes-into-a-pull-request)
- [Contributing Code](#contributing-code)
    - [Setting Up Your Development Environment](#setting-up-your-development-environment)
    - [Testing and Building](#testing-and-building)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Code Reviewing](#code-reviewing)
    - [Getting to the Code Review Stage](#getting-to-the-code-review-stage)

## Effective issue reporting in the Wazuh app repository

### Voicing the importance of an issue

We seriously appreciate thoughtful comments. If an issue is important to you, add a comment with a solid write up of your use case and explain why it's so important. Please avoid posting comments comprised solely of a thumbs up emoji 👍.

Granted that you share your thoughts, we might even be able to come up with creative solutions to your specific problem. If everything you'd like to say has already been brought up but you'd still like to add a token of support, feel free to add a [👍 thumbs up reaction](https://github.com/blog/2119-add-reactions-to-pull-requests-issues-and-comments) on the issue itself and on the comment which best summarizes your thoughts.

### "My issue isn't getting enough attention"

First of all, **sorry about that!**

The Wazuh team is always working hard on bringing to the community new and exciting capabilities, and prioritizing what to work on is an important aspect of our daily jobs. We prioritize everything according to impact and difficulty, so some GitHub issues can be neglected while we work on more pressing tasks.

Feel free to bump your issues if you think they've been neglected for a prolonged period.

### "I want to help!"

**Now we're talking**. If you have a bug fix or new feature that you would like to contribute to the Wazuh app, please **find or open an issue about it before you start working on it.** Talk about what you would like to do. It may be that somebody is already working on it, or that there are particular issues that you should know about before implementing the change.

We enjoy working with contributors to get their code accepted. There are many approaches to fixing a problem and it is important to find the best approach before writing too much code.

## How We Use Git and GitHub

### Branching

* All currently stable and released code goes into `master`.
* All work on the next major release goes into `X.Y` branch, following the current major and minor release of the [Wazuh HIDS core software](https://github.com/wazuh/wazuh/).
  * For example, the work for the Wazuh v3.2.1 release goes into the `3.2` branch.
* All work is done on feature branches and merged into one of these branches.
* Where appropriate, we'll backport changes into older release branches.

### Commits and Merging

* Feel free to make as many commits as you want, while working on a branch.
* When submitting a PR for review, please perform an interactive rebase to present a logical history that's easy for the reviewers to follow.
* Please use your commit messages to include helpful information on your changes, e.g. changes to controllers, UX changes, bugs fixed, and an explanation of *why* you made the changes that you did.
* Resolve merge conflicts by rebasing the target branch over your feature branch, and force-pushing (see below for instructions).
* When merging, we'll squash your commits into a single commit.

#### Rebasing and fixing merge conflicts

Rebasing can be tricky, and fixing merge conflicts can be even trickier because it involves force pushing. This is all compounded by the fact that attempting to push a rebased branch remotely will be rejected by git, and you'll be prompted to do a `pull`, which is not at all what you should do (this will really mess up your branch's history).

Here's how you should rebase master onto your branch, and how to fix merge conflicts when they arise.

First, make sure master is up-to-date.

```
git checkout master
git fetch upstream
git rebase upstream/master
```

Then, check out your branch and rebase master on top of it, which will apply all of the new commits on master to your branch, and then apply all of your branch's new commits after that.

```
git checkout name-of-your-branch
git rebase master
```

You want to make sure there are no merge conflicts. If there are merge conflicts, git will pause the rebase and allow you to fix the conflicts before continuing.

You can use `git status` to see which files contain conflicts. They'll be the ones that aren't staged for commit. Open those files, and look for where git has marked the conflicts. Resolve the conflicts so that the changes you want to make to the code have been incorporated in a way that doesn't destroy work that's been done in master. Refer to master's commit history on GitHub if you need to gain a better understanding of how code is conflicting and how best to resolve it.

Once you've resolved all of the merge conflicts, use `git add -A` to stage them to be commiteed, and then use `git rebase --continue` to tell git to continue the rebase.

When the rebase has completed, you will need to force push your branch because the history is now completely different than what's on the remote. **This is potentially dangerous** because it will completely overwrite what you have on the remote, so you need to be sure that you haven't lost any work when resolving merge conflicts. (If there weren't any merge conflicts, then you can force push without having to worry about this.)

```
git push origin name-of-your-branch --force
```

This will overwrite the remote branch with what you have locally. You're done!

**Note that you should not run `git pull`**, for example in response to a push rejection like this:

```
! [rejected] name-of-your-branch -> name-of-your-branch (non-fast-forward)
error: failed to push some refs to 'https://github.com/YourGitHubHandle/wazuh-kibana-app.git'
hint: Updates were rejected because the tip of your current branch is behind
hint: its remote counterpart. Integrate the remote changes (e.g.
hint: 'git pull ...') before pushing again.
hint: See the 'Note about fast-forwards' in 'git push --help' for details.
```

Assuming you've successfully rebased and you're happy with the code, you should force push instead.

### What Goes Into a Pull Request

* Please include an explanation of your changes in your PR description.
* Links to relevant issues, external resources, or related PRs are very important and useful.
* Please update any tests that pertain to your code, and add new tests where appropriate.
* See [Submitting a Pull Request](#submitting-a-pull-request) for more info.

## Contributing Code

These guidelines will help you get your Pull Request into shape so that a code review can start as soon as possible.

### Setting Up Your Development Environment

Follow our official [Wazuh installation guide](https://documentation.wazuh.com/current/installation-guide/installing-wazuh-server/index.html) and later, install the [Elastic Stack](https://documentation.wazuh.com/current/installation-guide/installing-elastic-stack/index.html). **Note that you have to skip the steps for Kibana**, since we're gonna install it in developer mode.

Then, clone the `elastic/kibana` repo and change directory into it. Check our currently supported Kibana version in order to checkout to the appropiate **tag**. Never checkout to a branch, since we always work with officially release Elastic Stack versions.

```bash
git clone https://github.com/elastic/kibana.git kibana
cd kibana
git checkout v[CURRENT_COMPATIBLE_VERSION]
```

Install the node dependencies (you need at least [NodeJS](https://nodejs.org/) 6.x):

```bash
npm install
```

Change into the `plugins` directory and clone your fork of the Wazuh app:

```bash
cd plugins
git clone https://github.com/YourGitHubHandle/wazuh-kibana-app.git wazuh
cd wazuh
```

Install the node dependencies (you need at least [NodeJS](https://nodejs.org/) 6.x):

```bash
npm install
```

Go again to the `kibana` directory, and start the development mode:

```bash
./bin/kibana --dev --no-base-path --server.host="0.0.0.0"
```

Now you can point your web browser to https://localhost:5601 and start using the Wazuh app! Everytime that you make changes into the code, you'll have to stop the Kibana server, delete the optimizing bundles, apply the changes, and then restart the server:

```bash
rm -rf /optimize/bundles
./bin/kibana --dev --no-base-path --server.host="0.0.0.0"
```

Enjoy coding! :smile:

### Testing and Building

To ensure that your changes will not break other functionality, please run your code and try to test the whole app funcionality.

First, focus your testing effort on everything involved to your code modifications (ask yourself ***"What has my code changed into the whole app structure?"***). Then, try to test the rest of the app, to ensure that everything seems stable with your changes.

Nevertheless, the Wazuh app team will test themselves your Pull Request with the internal testing process to totally guarantee that your code doesn't break anything.

## Submitting a Pull Request

Push your local changes to your forked copy of the repository and submit a Pull Request. In the Pull Request, describe what your changes do and mention the number of the issue where discussion has taken place, eg “Closes #123″.

Always submit your pull against the currently development branch unless the bug is only present in an older version. If the bug affects several branches say so in your pull.

Then sit back and wait. There will probably be discussion about the Pull Request and, if any changes are needed, we'll work with you to get your Pull Request merged into the Wazuh app.

## Code Reviewing

After a pull is submitted, it needs to get to review. If you have commit permission on the Wazuh app repo you will probably perform these steps while submitting your Pull Request. If not, a member of the Wazuh team will do them for you, though you can help by suggesting a reviewer for your changes if you've interacted with someone while working on the issue.

### Getting to the Code Review Stage

1. Assign the `review` label. This signals to the team that someone needs to give this attention.
1. Do **not** assign a version label. Someone from the Wazuh team staff will assign the rest of labels for organizing purporses.
1. Find someone to review your pull. Don't just pick any yahoo, pick the right person. The right person might be the original reporter of the issue, but it might also be the person most familiar with the code you've changed. If neither of those things apply, or your change is small in scope, try to find someone on the Wazuh team without a ton of existing reviews on their plate.

Thank you so much for reading our guidelines! :wave:
