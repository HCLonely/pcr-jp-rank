/* eslint-disable @typescript-eslint/no-var-requires */
const { spawnSync, execSync } = require('child_process');
const fs = require('fs');

const { GITHUB_TOKEN } = process.env;

const gitStatus = execSync('git status -s').toString();

if (!gitStatus) return;
console.log(spawnSync('git', ['add', '.']).output);
console.log(spawnSync('git', ['commit', '-m', 'Daily Sync']).output);
console.log(spawnSync('git', ['push', 'origin', 'main']).output);

if (gitStatus.includes('docs/cdn/')) {
  const version = fs.readFileSync('docs/cdn/version').toString();
  console.log(spawnSync('git', ['add', '.']).output);
  console.log(spawnSync('git', ['tag', '-a', version, '-m', 'update']).output);
  console.log(spawnSync('git', ['push', 'origin', version]).output);
}

if (gitStatus.includes('docs/')) {
  console.log(spawnSync('git', ['init'], { cwd: 'docs' }).output);
  console.log(spawnSync('git', ['add', '-A'], { cwd: 'docs' }).output);
  console.log(spawnSync('git', ['commit', '-m', 'Daily Sync'], { cwd: 'docs' }).output);
  console.log(spawnSync('git', ['push', '-u', `"https://x-access-token:${GITHUB_TOKEN}@github.com/HCLonely/pcr-jp-rank.git"`, 'HEAD:gh-pages', '--force'], { cwd: 'docs' }).output); // eslint-disable-line
}

/*
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
*/
