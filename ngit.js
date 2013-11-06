#!/usr/local/bin/node

stdio = require('stdio'),
fs = require('fs'),
jf = require('jsonfile'),
sync = require('execSync');

var VERSION="0.0.3",
BRANCHES = ".git_branches";


options = stdio.getopt({
  'version': {key: 'v', description: 'Current version'},
  'list': {key: 'l', description: 'List all named branches'},
  'checkout': {key: 'c', args: 1, description: 'Checkout a branch'},
  'merge': {key: 'm', args: 1, description: 'Merge a branch'},
  'update': {key: 'u', args: 1, description: 'Update a branch'},
  'set': {key: 's', args: 2, description: 'Set a stored branch'}
});

namedBranches = {
  c: 'current',
  o: 'other',
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
  var branchData = readBranchesFile();

  if (branchData['current']) {
    console.log('Current:\t', branchData['current']);
  }
  if (branchData['other']) {
    console.log('Other:\t\t', branchData['other']);
  }
  if (branchData['release']) {
    console.log('Release:\t', branchData['release']);
  }
  if (branchData['hotfix']) {
    console.log('Hotfix:\t\t', branchData['hotfix']);
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

  console.log('Set', setting, 'branch to:', options.set[1]);
  branchData[setting] = options.set[1];
  writeBranchesFile(branchData);
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

Check if the branch exists when setting, merging, etc.

Prioritized:

VERSION="0.1.0"
Define what goes in VERSION="0.2.0"

Backlog:

Pick and install colorer
Named branch config to an external file
Listing branches should use the named branch hash
Define what commands can be run together, what can't, and ordering

Setting my branches
  - 1-9
  - Unsetting
  - Max and Javon's, branches

List of branches
  - colors to gitlist
  - Numberify branches to be able to set branch by number
  - Interactive mode that lets you select/unselect branches

General branch management
  - Updating and merging
  - Merging a list of branches
  - Updating, then merging a list of branches
  - Merging in a list of branches
  - Merging in a list of branches to a list of branches

Origin
  - Checkout branches from origin into local repos
  - When checking for branches, also check origin
  - When setting a branch, offer to checkout the branch from origin, if it doesn't exist

DB Migrations
  - Running migrations after swiching to a branch
  - Getting a list of migrations not in another branch
  - Roll back list of migrations not in a branch switching to

Done:

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
