#!/usr/local/bin/node

stdio = require('stdio'),
fs = require('fs'),
jf = require('jsonfile');

VERSION="0.0.1"
BRANCHES=".git_branches"

options = stdio.getopt({
  'version': {key: 'v', description: 'Current version'},
  'list': {key: 'l', description: 'List all named branches'},
  'set': {key: 's', args: 2, description: 'Set a stored branch'}
});

if (options.version) {
  console.log('VERSION:', VERSION);
  return 0;
}

if (!isGit()) {
  process.stderr.write('Not in a git repo\n');
  process.exit(1);
}


/*
 * List all named branches
 */
if (options.list) {
  if (!fs.existsSync(BRANCHES)) {
    console.log('There is no', BRANCHES, 'file in this repo');
    process.exit(0);
  }

  branchData = jf.readFileSync(BRANCHES);

  if (branchData['current']) {
    console.log('Current:\t', branchData['current']);
  }
  if (branchData['other']) {
    console.log('Other:\t\t', branchData['other']);
  }
}


/*
 * Setting a named branch
 */
if (options.set) {
  var branchData = {},
  setting = '';

  if (fs.existsSync(BRANCHES)) {
    branchData = jf.readFileSync(BRANCHES);
  }

  if (options.set[0] == 'c') {
    setting = 'current'
  }
  else if (options.set[0] == 'o') {
    setting = 'other'
  }
  else {
    console.error('Unknown named branch:', options.set[0]);
    process.exit(2);
  }

  console.log('Set', setting, 'branch to:', options.set[1]);
  branchData[setting] = options.set[1];
  jf.writeFileSync(BRANCHES, branchData);
}

function isGit() {
  var gitPath = './.git';

  if (!fs.existsSync(gitPath)) {
    return false;
  }

  return fs.statSync(gitPath).isDirectory();
}

/*
Inprogress:

VERSION="0.0.2"

Prioritized:

Setup *master* and *develop*
Switching around branches
VERSION="0.0.3"

Backlog:

Define what goes into 0.1.0
Pick and install colorer
Checkout branches from origin into local repos

Setting my branches
  - Release
  - Hotfix
  - 1-9
  - Unsetting
  - Check if the branch exists
  - Check origin if the branch exists, but doesn't in local
  - Offer to checkout the branch from origin, if it doesn't exist
  - Max and Javon

List of branches
  - colors to gitlist
  - Numberify branches to be able to set branch by number
  - Interactive mode that lets you select/unselect branches for different modes

General branch management
  - Merging
  - Updating
  - Updating and merging
  - Merging a list of branches
  - Updating, then merging a list of branches
  - Merging in a list of branches
  - Merging in a list of branches to a list of branches

DB Migrations
  - Running migrations after swiching to a branch
  - Getting a list of migrations no in another branch
  - Rolling back the list of migrations not in a branch

Done:

Add gitlist functionality
Setting my *other* branch
Setting my *current* branch

VERSION="0.0.0"
Setup cli parsing
Pick and intall cli parser
Setup npm for project
VERSIONing

 */
