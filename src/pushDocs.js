/* eslint-disable @typescript-eslint/no-var-requires */
const { spawn } = require('child_process');

const { GITHUB_TOKEN } = process.env;

function git(...args) {
  return spawn('git', args, {
    cwd: 'docs',
    verbose: true,
    stdio: 'inherit'
  });
}

function setup() {
  const userName = 'github-actions[bot]';
  const userEmail = '41898282+github-actions[bot]@users.noreply.github.com';

  // Create a placeholder for the first commit
  return git('init').then(() => userName && git('config', 'user.name', userName))
    .then(() => userEmail && git('config', 'user.email', userEmail))
    .then(() => git('add', '-A'))
    .then(() => git('commit', '-m', 'Daily Sync'));
}

function push() {
  return git('add', '-A').then(() => git('commit', '-m', 'Daily Sync').catch(() => {
    // Do nothing. It's OK if nothing to commit.
  }))
    .then(() => git('push', '-u', `"https://x-access-token:${GITHUB_TOKEN}@github.com/HCLonely/pcr-jp-rank.git"`, 'HEAD:gh-pages', '--force'));
}

setup().then(() => push());
