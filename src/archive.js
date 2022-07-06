/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs-extra');
const path = require('path');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);
const date = dayjs().tz('Asia/Shanghai')
  .format('YYYY-MM-DD');

fs.copySync('docs/', `temp/${date}`, {
  filter: (src) => !src.includes('cdn') && !src.includes('archived')
});
fs.copySync(`temp/${date}`, `docs/archived/${date}`);

fs.readdirSync(`docs/archived/${date}`).filter((e) => /\.(html|js|css|scss)$/.test(e))
  // eslint-disable-next-line max-len
  .map((e) => fs.writeFileSync(path.join(`docs/archived/${date}`, e), fs.readFileSync(path.join(`docs/archived/${date}`, e)).toString()
    .replace(/\.\//g, `./${date}/`)));
