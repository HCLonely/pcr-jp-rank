/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./unit-data/redive_jp.db');

const downloadUnitDb = async () => {
  const writer = fs.createWriteStream('./unit-data/redive_jp.db');
  const response = await axios({
    url: 'https://redive.estertion.win/db/redive_jp.db',
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);
  return new Promise((resolve) => {
    writer.on('finish', () => { resolve(true); });
    writer.on('error', () => { resolve(false); });
  });
};

const getData = async () => {
  const currentVersion = fs.existsSync('./unit-data/version.json') ?
    fs.readFileSync('./unit-data/version.json').toJSON().TruthVersion :
    0;
  const lastVersionInfo = (await axios.get('https://redive.estertion.win/last_version_jp.json')).data;

  if (!lastVersionInfo) {
    return;
  }
  if (currentVersion < lastVersionInfo.TruthVersion) {
    fs.writeFileSync('./unit-data/version.json', JSON.stringify(lastVersionInfo));
    await downloadUnitDb();
  }
  return;
};
module.exports = async () => {
  await getData();
  const unitInfo = await new Promise((resolve, reject) => {
  // eslint-disable-next-line max-len
    db.all('select unit_id,unit_name,age,guild,race,height,weight,birth_month,birth_day,blood_type from unit_profile WHERE unit_id<400000', (err, row) => {
      if (err) {
        reject(err);
      }
      resolve(row);
    });
  })
    .then((data) => data)
    .catch((error) => { throw error; });

  if (!unitInfo) {
    return;
  }

  // 站位
  const unitLocation = await new Promise((resolve, reject) => {
    db.all('select unit_id,search_area_width from unit_data WHERE unit_id<400000', (err, row) => {
      if (err) {
        reject(err);
      }
      resolve(row);
    });
  })
    .then((data) => data)
    .catch((error) => { throw error; });

  if (!unitLocation) {
    return;
  }
  db.close();

  return JSON.parse(JSON.stringify(unitInfo.map((unit) => {
    unit.search_area_width = unitLocation.find((e) => e.unit_id === unit.unit_id)?.search_area_width;
    return unit;
  })).replaceAll('（', '(')
    .replaceAll('）', ')')
    .replaceAll('＆', '&')
    .replaceAll('ぺコリーヌ', 'ペコリーヌ'));
};
