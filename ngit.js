#!/usr/local/bin/node

stdio = require('stdio'),
fs = require('fs'),
jf = require('jsonfile'),
sync = require('execSync');
_ = require('underscore');

var VERSION="0.1.0",
    BRANCHES = ".git_branches";


options = stdio.getopt({
  'version': {key: 'v', description: 'Current version'},
  'list': {key: 'l', description: 'List all named branches'},
  'set': {key: 's', args: 2, description: 'Set a stored branch'},
  'unset': {key: 'r', args: 1, description: 'Unset a stored branch'},
  'checkout': {key: 'c', args: 1, description: 'Checkout a branch'},
  'merge': {key: 'm', args: 1, description: 'Merge a branch'},
  'update': {key: 'u', args: 1, description: 'Update a branch'},
  'update_merge': {key: 'g', args: 2, description: 'Update a branch and merge it into another'}
});

namedBranches = {
  c: 'current',
  o: 'other',
  x: 'max',
  j: 'javon',
  r: 'release',
  h: 'hotfix'
};

mainBranches = {
  m: 'master',
  d: 'develop'
}


/*
 * Display version info and exit, if -v is specified
 */
if (options.version) {
  console.log('VERSION:', VERSION);
  return 0;
}


/*
 * Require being in a git repo from now on
 */
if (!fs.existsSync('./.git') || !fs.statSync('./.git').isDirectory()) {
  process.stderr.write('Not in a git repo\n');
  process.exit(1);
}


/*
 * List all named branches
 */
if (options.list) {
  _.each(readBranchesFile(), function(key, value) {
    console.log(value, '-', key);
  });
}


/*
 * Setting a named branch
 */
if (options.set) {
  if (!namedBranches[options.set[0]]) {
    console.error('Unknown named branch:', options.set[0]);
    process.exit(2);
  }

  var setting = namedBranches[options.set[0]],
  branchData = readBranchesFile(false);
  branchName = options.set[1];

  ensureBranchExists(branchName);

  console.log('Set', setting, 'branch to:', branchName);
  branchData[setting] = branchName;
  writeBranchesFile(branchData);
}


/*
 * Unsetting a named branch
 */
if (options.unset) {
  var branchName = namedBranches[options.unset[0]];

  if (!branchName) {
    console.error('Unknown named branch:', options.unset[0]);
    process.exit(2);
  }

  branchData = readBranchesFile();
  if (!branchData[branchName]) {
    console.error('Named branch is not set:', options.unset[0]);
    process.exit(2);
  }

  console.log('Unsetting', branchName);
  writeBranchesFile(_.omit(branchData, branchName));
}

/*
 * Git branch commands
 */
if (options.checkout) {
  gitExec('checkout', options.checkout[0]);
}

if (options.merge) {
  gitExec('merge', options.merge[0]);
}

if (options.update) {
  gitExec('checkout', options.update[0]);
  gitExec('pull');
}

if (options.update_merge) {
  gitExec('checkout', options.update_merge[0]);
  gitExec('pull');
  gitExec('checkout', options.update_merge[1]);
  gitExec('merge', options.update_merge[0]);
}

/*
 * Execute git command on a branch
 */
function gitExec(command, branch) {
  if (branch !== undefined && !namedBranches[branch] && !mainBranches[branch]) {
    console.error('Unknown branch:', branch);
    process.exit(2);
  }

  var execString = 'git ' + command;

  if (branch !== undefined) {
    var branchData = readBranchesFile();
    var branchName = namedBranches[branch] ? branchData[namedBranches[branch]] : mainBranches[branch];

    execString += ' ' + branchName;
  }

  results = sync.exec(execString)
  if (results.code !== 0) {
    console.error(results.stdout);
    process.exit(results.code);
  }

  return results.stdout;
}


/*
 * Check if a branch exists
 */
function branchExists(branch) {
  branchList = _.map(gitExec('branch').split('\n'), function(line) {return line.replace('*', ' ').trim()});

  return _.contains(branchList, branch);
}

function ensureBranchExists(branch) {
  if (!branchExists(branch)) {
    console.error('Branch does not exist:', branch);
    process.exit(3);
  }
}

/*
 * Reading and writing the branches file
 */
function readBranchesFile(fail) {
  fail = typeof fail !== 'undefined' ? fail : true;

  if (!fs.existsSync(BRANCHES) && fail) {
    console.error(BRANCHES, 'does not exist');
    process.exit(2);
  }
  else if (!fs.existsSync(BRANCHES)) {
    return {};
  }

  return jf.readFileSync(BRANCHES);
}

function writeBranchesFile(data) {
  jf.writeFileSync(BRANCHES, data);
}

/*
Inprogress:

VERSION="0.1.1"

Prioritized:

Also lists local branches
Checkout branches from origin into local repos
When checking for branches, also check origin
VERSION="0.1.2"

0.2.0:

Pick and install colorer
Colors to gitlist, by optional config
Named branch config to an external file

Backlog:

Define what commands can be run together, what can't, and ordering

Setting my branches
  - 1-9

List of branches
  - Gives warning if a branch no longer exists
  - Listing local branches does not show branches used by a named branch
  - Numberify branches to be able to set branch by number
  - Interactive mode that lets you select/unselect branches

General branch management
  - Ensure branch exists for all branch commands
  - Merging a list of branches
  - Updating, then merging a list of branches
  - Merging in a list of branches
  - Merging in a list of branches to a list of branches

Origin
  - When setting a branch, offer to checkout the branch from origin, if it doesn't exist
  - Offer to create and push branch if doesn't exist anywhere
  - Pushing
  - Pushing a local branch

Flow
  - Git flow simplifications
  - Offer to start a flow when branch doesn't exist
  - Offer to push new flow to origin after created

DB Migrations
  - Running migrations after swiching to a branch
  - Getting a list of migrations not in another branch
  - Roll back list of migrations not in a branch switching to

Done:

Updating and merging a branch
Unsetting a branch
Max and Javon's, branches

VERSION="0.1.0"
Listing branches should use the named branch hash
Check if the branch exists when setting, merging, etc.
Updating branch
Merging branch
Setting branch release
Setting branch hotfix

VERSION="0.0.3"
Setup *master* and *develop*
Refactor named brach handling code
Refactor reading and writing code
Switching around branches

VERSION="0.0.2"
Add gitlist functionality
Setting my *other* branch
Setting my *current* branch

VERSION="0.0.1"
Setup cli parsing
Pick and intall cli parser
Setup npm for project
VERSIONing

VERSION="0.0.0"

 */
