/* eslint-disable @typescript-eslint/no-var-requires */
const { spawn, execSync } = require('child_process');
const fs = require('fs');

const { GITHUB_TOKEN } = process.env;

const gitStatus = execSync('git status -s').toString();

if (!gitStatus) return;

spawn('git', ['add', '.'])
  .then(() => spawn('git', ['commit', '-m', 'Daily Sync']))
  .then(() => spawn('git', ['push', 'origin', 'main']));

if (gitStatus.includes('docs/cdn/')) {
  const version = fs.readFileSync('docs/cdn/version').toString();
  spawn('git', ['add', '.'])
    .then(() => spawn('git', ['tag', '-a', version, '-m', 'update']))
    .then(() => spawn('git', ['push', 'origin', version]));
}

if (gitStatus.includes('docs/')) {
  spawn('git', ['init'], { cwd: 'docs' })
    .then(() => spawn('git', ['add', '-A'], { cwd: 'docs' }))
    .then(() => spawn('git', ['commit', '-m', 'Daily Sync'], { cwd: 'docs' }))
    .then(() => spawn('git', ['push', '-u', `"https://x-access-token:${GITHUB_TOKEN}@github.com/HCLonely/pcr-jp-rank.git"`, 'HEAD:gh-pages', '--force'], { cwd: 'docs' })); // eslint-disable-line
}
