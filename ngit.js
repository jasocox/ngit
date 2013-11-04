#!/usr/local/bin/node

stdio = require('stdio'),
fs = require('fs'),
jf = require('jsonfile'),
exec = require('child_process').exec;

var VERSION="0.0.3",
BRANCHES = ".git_branches";


options = stdio.getopt({
  'version': {key: 'v', description: 'Current version'},
  'list': {key: 'l', description: 'List all named branches'},
  'checkout': {key: 'c', args: 1, description: 'Checkout a branch'},
  'set': {key: 's', args: 2, description: 'Set a stored branch'}
});

namedBranches = {
  c: 'current',
  o: 'other'
};

mainBranches = {
  m: 'master',
  d: 'develop'
}


/*
 * Display version info and exit
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
}


/*
 * Checkout a named branch
 */
if (options.checkout) {
  if (!namedBranches[options.checkout[0]] && !mainBranches[options.checkout[0]]) {
    console.error('Unknown branch:', options.checkout[0]);
    process.exit(2);
  }

  var branchData = readBranchesFile();
  var checkout = namedBranches[options.checkout[0]] ? branchData[namedBranches[options.checkout[0]]] : mainBranches[options.checkout[0]];

  execString = 'git checkout ' + checkout;
  exec(execString, function(err, stdout, stderr) {
    if (err !== null) {
      console.error(err.message);
    }
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

  console.log('Set', setting, 'branch to:', options.set[1]);
  branchData[setting] = options.set[1];
  writeBranchesFile(branchData);
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

Define what goes into 0.1.0

Prioritized:


Backlog:

Pick and install colorer
Named branch config to an external file

Setting my branches
  - Release
  - Hotfix
  - 1-9
  - Unsetting
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

Origin
  - Checkout branches from origin into local repos
  - Check if the branch exists
  - Check origin if the branch exists, but doesn't in local
  - Offer to checkout the branch from origin, if it doesn't exist

DB Migrations
  - Running migrations after swiching to a branch
  - Getting a list of migrations no in another branch
  - Rolling back the list of migrations not in a branch

Done:

VERSION="0.0.2"
Setup *master* and *develop*
Refactor named brach handling code
Refactor reading and writing code
Switching around branches

VERSION="0.0.1"
Add gitlist functionality
Setting my *other* branch
Setting my *current* branch

VERSION="0.0.0"
Setup cli parsing
Pick and intall cli parser
Setup npm for project
VERSIONing

 */
