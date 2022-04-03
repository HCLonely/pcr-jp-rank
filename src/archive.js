/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs-extra');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);
const date = dayjs().tz('Asia/Shanghai')
  .format('YYYY-MM-DD');

fs.copySync('docs/', `temp/${date}`, {
  filter: (src) => !src.includes('cdn') && !src.includes('archived') && !src.includes('.git')
});
fs.copySync(`temp/${date}`, `docs/archived/${date}`);
