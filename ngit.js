#!/usr/local/bin/node

stdio = require('stdio'),
fs = require('fs'),
jf = require('jsonfile'),
sync = require('execSync');
_ = require('underscore');

var VERSION="0.1.2",
    BRANCHES = ".git_branches",
    NAMED_BRANCHES = ".named_branches";


options = stdio.getopt({
  'version': {key: 'v', description: 'Current version'},
  'origin': {key: 'o', description: 'Include origin features when executing command'},
  'list': {key: 'l', description: 'List all named branches'},
  'set': {key: 's', args: 2, description: 'Set a stored branch'},
  'unset': {key: 'r', args: 1, description: 'Unset a stored branch'},
  'checkout': {key: 'c', args: 1, description: 'Checkout a branch'},
  'merge': {key: 'm', args: 1, description: 'Merge a branch'},
  'update': {key: 'u', args: 1, description: 'Update a branch'},
  'update_merge': {key: 'g', args: 2, description: 'Update a branch and merge it into another'}
});

/*
 * Example .named_branches file:
{
  "c": "current",
  "o": "other",
  "x": "max",
  "j": "javon",
  "r": "release",
  "h": "hotfix"
}
 */

/*
 * Used for flowdock specific branches, but if you are not using flowdock, you
 * should do this anyway.
 */
var mainBranches = {
  m: 'master',
  d: 'develop'
};


/*
 * Display version info and exit, if -v is specified
 */
if (options.version) {
  console.log('VERSION:', VERSION);
  return 0;
}


/*
 * Read named branches file, or set default
 */
var namedBranches;

if (fs.existsSync(NAMED_BRANCHES)) {
  namedBranches = jf.readFileSync(NAMED_BRANCHES);
}
else {
  namedBranches = {
    c: 'current',
    o: 'other'
  }
}


/*
 * Require git and cli sanitization
 */
if (!fs.existsSync('./.git') || !fs.statSync('./.git').isDirectory()) {
  process.stderr.write('Not in a git repo\n');
  process.exit(1);
}

var optionSet = false;
_.each([options.list, options.set, options.unset, options.checkout, options.merge, options.update, options.update_merge], function (option) {
  if (option && optionSet) {
    console.error('Cannot set more than on option at a time');
    process.exit(2);
  }
  else if (option) {
    optionSet = true;
  }
});

if (!optionSet) {
  console.error('Must specify an option');
  process.exit(2);
}


/*
 * List all named branches
 */
if (options.list) {
  _.each(readBranchesFile(), function(value, key) {
    if (branchExists(value)) {
      console.log(key, '-', value);
    }
    else {
      console.log(key, '-', value, '(warning: no longer exists)');
    }
  });

  console.log();
  console.log('Local Branches:');
  _.each(gitBranchList(), function(branch) {
    console.log(branch)
  });

  if (options.origin) {
    console.log();
    console.log('Origin Branches:');
    _.each(gitOriginBranchList(), function(branch) {
      console.log(branch);
    });
  }
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
  gitCommand(['checkout', options.checkout[0]]);
}

if (options.merge) {
  gitMergeBranch(options.merge[0]);
}

if (options.update) {
  gitCommands([['checkout', options.update[0]],
              ['pull']]);
}

if (options.update_merge) {
  gitCommands([['checkout', options.update_merge[0]],
              ['pull'],
              ['checkout', options.update_merge[1]]]);

  gitMergeBranch(options.update_merge[0]);
}

function gitMergeBranch(branch) {
  gitCommands(['merge', branch]);
}

/*
 * Execute git command on a branch
 */
function gitCommand(command) {
  gitExecAndLog(command[0], command[1]);
}

function gitCommands(commands) {
  _.each(commands, function(command) { gitCommand(command) });
}

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

function gitExecAndLog(command, branch) {
  console.log(gitExec(command, branch));
}

/*
 * Check if a branch exists
 */
function branchExists(branch) {
  branchList = cleanBranchList(gitBranchList());

  return _.contains(branchList, branch);
}

function originBranchExists(branch) {
  branchList = cleanBranchList(gitOriginBranchList());

  return _.contains(branchList, branch);
}

function ensureBranchExists(branch) {
  existsLocal = branchExists(branch);

  if (options.origin && !existsLocal && originBranchExists(branch)) {
    console.log('Branch exists in origin, but not local. Please check it out locally to continue...');
    process.exit(0);
  }
  else if (!existsLocal) {
    console.error('Branch does not exist:', branch);
    process.exit(3);
  }
}

function ensureBranchesExist(branches) {
  _.forEach(branches, function(branch) { branchExists(branch) });
}


/*
 * Git branch helpers
 */
function gitBranchList() {
  branchList = gitExec('branch').split('\n');
  branchList.pop();

  return branchList;
}

function gitOriginBranchList() {
  branchList = gitExec('branch --all | grep remotes/origin').split('\n');
  branchList.pop();

  return cleanOriginBranchList(branchList);
}

function cleanBranchList(branchList) {
  return _.map(branchList, function(line) {
    return line.replace('*', ' ').trim();
  });
}

function cleanOriginBranchList(branchList) {
  return _.map(branchList, function(branch) {
    return branch.replace('remotes/origin/', '');
  });
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

Pick and install colorer

Prioritized:

Colors to gitlist, by optional config
VERSION="0.2.0"

0.3.0:
Optional config for ordering named branches for git list
Merging a list of branches
Updating, then merging a list of branches
Numberify branches and prompt to be able to set branch by number
Diff two branches
List files changed between two branches
Fetch before any command that uses origin (warning if fails)
When setting a branch, offer to checkout the branch from origin, if it doesn't exist in local but does in origin
Git flow simplifications

Backlog:

List of branches
  - Interactive mode that lets you select/unselect branches

General branch management
  - Merging in a list of branches to a branch
  - Merging in a list of branches to a list of branches
  - Updating and merging in a list of branches to a branch
  - Updating and merging in a list of branches to a list of branches

Origin
  - Offer to create and push branch if doesn't exist anywhere

Flow
  - Offer to start a flow when branch doesn't exist
  - Offer to push new flow to origin after created

Merging
  - When merging, fail on merge conflict and keep track of progress
  - Allow a continue function that lets you continue after resolving a merge conflict
  - Check to see if the merge is resolved before continuing

DB Migrations
  - Running migrations after switching to a branch
  - Getting a list of migrations not in another branch
  - Roll back list of migrations not in a branch switching to

Done:

When checking for branches, also check origin
Optionally list remote/origin branches as well with git list

VERSION="0.1.2"
Named branch config to an external file
Define what commands can be run together, what can't, and ordering
Gives warning if a branch no longer exists
Ensure branch exists for all branch commands
Log gitExec if you want
Also lists local branches

VERSION="0.1.1"
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
