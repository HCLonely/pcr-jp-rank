import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { load } from 'cheerio';
import * as dayjs from 'dayjs';

const textMap = JSON.parse(fs.readFileSync('text-map.json').toString());

// 格式化Html
const formatHtml = (html: string, title: string, className: string): string => {
  const $ = load(html);
  $('noscript').remove();
  $('td').find('br')
    .remove();
  $('tr').removeAttr('class data-status data-col data-col1 data-col2 data-col3 data-col4 data-col5 data-col6 data-col7 data-col8');
  $('th').removeAttr('data-status data-col');
  const iconTds = $('td').has('a>img');
  iconTds.map((index) => {
    const element = iconTds.eq(index);
    element.html(element.find('a').html() as string);
    return null;
  });
  const tds = $('td').has('img');
  tds.map((index) => {
    const element = tds.eq(index);
    element.find('img')
      .removeClass('w-article-img c-blank-img')
      .removeAttr('data-use-lazyload')
      .attr('width', '50px')
      .attr('height', '50px')
      .after(`<br/>${(className === 'new' && index % 8 !== 0 && !element.text()) ? ' ' : ''}`);
    return null;
  });
  $('table').addClass(className)
    .before(`<div id="${className}"></div><h2>${title}</h2>`);
  return $('body').html() as string;
};
// 格式化竞技场Html
const formatJjcHtml = (html: string, title: string, className: string): string => {
  const $ = load(html);
  $('noscript').remove();
  $('td').find('br')
    .remove();
  const iconTds = $('td').has('a>img');
  iconTds.map((index) => iconTds.eq(index).html(iconTds.eq(index).find('a')
    .toArray()
    .map((e) => $(e).html())
    .join('') as string));
  $('img')
    .removeClass('w-article-img c-blank-img')
    .removeAttr('data-use-lazyload')
    .attr('width', '50px')
    .attr('height', '50px');
  $('table').addClass(className)
    .before(`<div id="${className}"></div><h2>${title}</h2>`);
  return $('body').html() as string;
};
// 格式化全角色一览Html
const formatHitiranHtml = (html: string): string => {
  const $ = load(html);
  $('table').prepend(`<thead>${$('tr').eq(0)
    .prop('outerHTML')}</thead>`);
  $('thead th').append('<span class="sorttable-switch"></span>');
  $('tr').eq(1)
    .remove();
  $('table').eq(0)
    .attr('border', '1px solid #ccc');
  $('table').before('<div class="search-div"><input class="search" placeholder="请输入角色名/昵称筛选" oninput="searchName();" onpropertychange="searchName();"/></div>'); // eslint-disable-line
  return $('body').html() as string;
};

// 合并综合排序的TO-T4
const tablePlus = (rootHtml:string, ...htmls: Array<string>) => {
  const $ = load(rootHtml);
  for (const html of htmls) {
    $('tbody').append(load(html)('tbody')
      .html() as string);
  }
  return $.html();
};

// 部分文本替换
const replaceText = (text: string): string => {
  for (const [reg, value] of Object.entries(textMap)) {
    if (new RegExp(reg, 'g').test(text)) {
      // eslint-disable-next-line no-param-reassign
      text = text.replace(new RegExp(reg, 'g'), value as string);
    }
  }
  return text;
};

// 获取角色别名 https://github.com/Ice-Cirno/HoshinoBot/blob/master/hoshino/modules/priconne/_pcr_data.py
// const getNameData = () => axios.get('https://raw.githubusercontent.com/Ice-Cirno/HoshinoBot/master/hoshino/modules/priconne/_pcr_data.py')
const getNameData = () => axios.get('https://cdn.jsdelivr.net/gh/Ice-Cirno/HoshinoBot@master/hoshino/modules/priconne/_pcr_data.py')
  .then((response) => {
    if (response.status === 200 && response.data) {
      return (response.data.match(/CHARA_NAME = (\{[\w\W]+?\}\n\n)/)?.[1].split(/\n+/) as Array<string>).map((e) => {
        const nameRaw = e.match(/^[\s]+?[\d]+?:[\s]+?(\[.+?\])/)?.[1];
        if (nameRaw) {
          return JSON.parse(nameRaw.replace(/＆/g, '&'));
        }
        return null;
      })
        .filter((e) => e);
    }
    throw response;
  })
  .catch((error) => { throw error; });

// 角色名替换为中文
const replaceName = async (html: string, nameData: Array<Array<string>>): Promise<string> => {
  const $ = load(html);
  $('td').map((index, element) => {
    const nameJp = $(element).text()
      .trim()
      .replace(/＆/g, '&');
    const nameArr = nameData.find((e) => e.includes(nameJp.replace('(6⭐)', '')));

    if (nameArr) {
      $('td').eq(index)
        .html(($('td').eq(index)
          .html() as string)
          .replace(/＆|&amp;/g, '&')
          .replaceAll(nameJp, nameArr[0] + (nameJp.includes('6⭐') ? '(6⭐)' : '')));
    }
    return element;
  });
  return $('body').html() as string;
};

const downloadFile = async (url: string, fileDir: string): Promise<void> => {
  const filepath = path.resolve(fileDir, url.replace('https://img.gamewith.jp/article_tools/pricone-re/gacha/', ''));
  if (fs.existsSync(filepath)) {
    return;
  }
  const writer = fs.createWriteStream(filepath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
};
// 下载图片
const downloadPic = (html: string) => {
  const $ = load(html);
  return Promise.all(
    $('img').toArray()
      .map((e) => $(e).attr('data-src'))
      .filter((e) => e)
      .map((e) => downloadFile(e as string, './docs/cdn'))
  );
};
// 获取并保存排行数据
axios.get('https://gamewith.jp/pricone-re/article/show/93068')
  .then(async (response) => {
    if (response.status === 200 && response.data) {
      const nameData = await getNameData();
      const $ = load(response.data);
      const newtiHtml = replaceText($('div.puri_newiti-table').html() as string);
      const table = $('.puri_5col-table');
      const allRank1Html = replaceText(table.eq(0).html() as string);
      const allRank2Html = replaceText(table.eq(1).html() as string);
      const questHtml = replaceText(`<table>${(table.eq(2).html() as string)}</table>`);
      const clanBattleHtml = replaceText(table.eq(3).html() as string);
      const jjcHtml = replaceText($('div.puri_rank123-table').html() as string);
      const hitiranHtml = replaceText($('div.puri_hitiran-table').html() as string);
      const updateTime = $('time[datetime]').attr('datetime');
      const html = await replaceName(
        formatHtml(newtiHtml, '新角色评价', 'new') +
        formatHtml(tablePlus(allRank1Html, allRank2Html), '综合排行榜', 'all') +
        formatHtml(questHtml, '推图排行榜', 'quest') +
        formatJjcHtml(jjcHtml, '竞技场排行榜', 'jjc') +
        formatHtml(clanBattleHtml, '工会战排行榜', 'clan'), nameData
      );
      const html2 = await replaceName(formatHitiranHtml(formatHtml(hitiranHtml, '全角色一览', 'all-c')), nameData);
      fs.writeFileSync('docs/raw.html', fs.readFileSync('template.html').toString()
        .replace('__HTML__', html)
        .replace('__HTML2__', html2)
        .replace('__NAMEDATA__', JSON.stringify(nameData))
        .replaceAll('https://img.gamewith.jp/assets/images/common/transparent1px.png', './img/unknown.jpg')
        .replace('__UPDATETIME__', dayjs(updateTime).format('YYYY-MM-DD HH:mm:ss'))
        .replace('__SYNCTIME__', dayjs().format('YYYY-MM-DD HH:mm:ss')));
      downloadPic(html + html2);
    }
  });
