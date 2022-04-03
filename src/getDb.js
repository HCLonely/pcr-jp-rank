/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();

const downloadUnitDb = async (server) => {
  const writer = fs.createWriteStream(`./unit-data/redive_${server}.db`);
  const response = await axios({
    url: `https://redive.estertion.win/db/redive_${server}.db`,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);
  return new Promise((resolve) => {
    writer.on('finish', () => { resolve(true); });
    writer.on('error', () => { resolve(false); });
  });
};

const getData = async (server) => {
  const currentVersion = fs.existsSync(`./unit-data/version_${server}.json`) ?
    fs.readFileSync(`./unit-data/version_${server}.json`).toJSON().TruthVersion :
    0;
  const lastVersionInfo = (await axios.get(`https://redive.estertion.win/last_version_${server}.json`)).data;

  if (!lastVersionInfo) {
    return;
  }
  if (currentVersion < lastVersionInfo.TruthVersion) {
    fs.writeFileSync(`./unit-data/version_${server}.json`, JSON.stringify(lastVersionInfo));
    await downloadUnitDb(server);
  }
  return;
};

const readDb = async (server) => {
  const db = new sqlite3.Database(`./unit-data/redive_${server}.db`);
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

  return unitInfo.map((unit) => {
    unit.search_area_width = unitLocation.find((e) => e.unit_id === unit.unit_id)?.search_area_width;
    return unit;
  });
};
module.exports = async () => {
  await getData('jp');
  await getData('cn');

  const jpData = await readDb('jp');
  const cnData = await readDb('cn');

  const finalData = jpData.map((unit) => {
    const cnName = cnData.find((e) => e.unit_id === unit.unit_id);
    if (cnName) {
      unit.unit_name_cn = cnName.unit_name;
    }
    return unit;
  });
  cnData.map((unit) => {
    if (!finalData.find((e) => e.unit_id === unit.unit_id)) {
      finalData.push(unit);
    }
    return unit;
  });

  return JSON.parse(JSON.stringify(finalData).replaceAll('（', '(')
    .replaceAll('）', ')')
    .replaceAll('＆', '&')
    .replaceAll('ぺコリーヌ', 'ペコリーヌ'));
};
