import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { load } from 'cheerio';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import { execSync } from 'child_process';
import * as getUnitData from './getDb';

interface unitData {
  unit_id: number
  unit_name: string
  age: number
  guild: string
  race: string
  height: number
  weight: number
  birth_month: number
  birth_day: number
  blood_type: string
  search_area_width: number
  names?: Array<string>
}

interface stringObject {
  [key: string]: string
}
dayjs.extend(utc);
dayjs.extend(timezone);

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
      .after(`<br/>${(className === 'new' && index % 8 !== 0 && !element.text()) ? ' ' : ''}`)
      .map((i, e) => {
        if (!$(e).attr('data-src') && $(e).attr('src')) {
          $(e).attr('data-src', $(e).attr('src'))
            .attr('src', './img/unknown.jpg')
            .addClass('js-lazyload-fixed-size-img');
        }
        return e;
      });
    return null;
  });
  $('table').addClass(className)
    .before(`<div id="${className}" class="anchor-div"></div><h2>${title}</h2>`);
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
    .before(`<div id="${className}" class="anchor-div"></div><h2>${title}</h2>`);
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
  for (const [reg, value] of textMap) {
    if (new RegExp(reg, 'g').test(text)) {
      // eslint-disable-next-line no-param-reassign
      text = text.replace(new RegExp(reg, 'g'), value as string);
    }
  }
  return text;
};

// 获取角色别名 https://github.com/Ice-Cirno/HoshinoBot/blob/master/hoshino/modules/priconne/_pcr_data.py
const getNameData = () => axios.get('https://raw.githubusercontent.com/Ice-Cirno/HoshinoBot/master/hoshino/modules/priconne/_pcr_data.py')
// const getNameData = () => axios.get('https://cdn.jsdelivr.net/gh/Ice-Cirno/HoshinoBot@master/hoshino/modules/priconne/_pcr_data.py')
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
// JJC角色名替换为中文
const replaceJjcName = async (html: string, nameData: Array<Array<string>>): Promise<string> => {
  const $ = load(html);
  $('td').has('img[data-src]')
    .map((index, element) => {
      if (!$(element).text() && $(element).find('img[data-src]').length > 1) {
        $(element).find('img[data-src]')
          .map((i, e) => {
            const nameJp = $(e).attr('alt')
              ?.trim()
              ?.replace(/＆/g, '&');
            if (!nameJp) return e;
            const nameArr = nameData.find((e) => e.includes(nameJp));
            if (nameArr) {
              $(e).attr('alt', nameArr[0]);
            }
            return e;
          });
      }
      return element;
    });
  return $('body').html() as string;
};
// 替换图片链接为CDN连接
const replacePicCdn = (html: string): string => {
  const $ = load(html);
  $('img[data-src]').map((i, e) => $(e).attr('data-src', ($(e).attr('data-src') as string)
    .replace('https://img.gamewith.jp/article_tools/pricone-re/gacha/', 'https://cdn.jsdelivr.net/gh/hclonely/pcr-jp-rank@main/docs/cdn/')));
  return $.html() as string;
};

// 添加角色详情链接
const addLink = async (html: string, nameData: Array<Array<string>>, unitData: Array<unitData>): Promise<string> => {
  if (!unitData) {
    throw 'Get Unit Data Failed!';
  }
  const unitIds = unitData.map((unit) => {
    const matched = nameData.find((e) => e.includes(unit.unit_name));
    if (!matched) {
      return null;
    }
    return {
      id: unit.unit_id,
      names: matched
    };
  });
  const $ = load(html);
  $('td').has('img[data-src]')
    .map((index, element) => {
      const img = $(element).find('img[data-src]');
      if (img.length > 1) {
        img.map((i, e) => {
          const names = nameData.find((name) => name.includes($(e).attr('alt') as string));
          $(e).attr('title', names?.join(' | ') || $(e).attr('alt'));
          const id = unitIds.find((unit) => unit?.names?.includes($(e).attr('alt') as string))?.id;
          if (id) {
            $(e).wrap(`<a class="unit-link" href="https://pcr.satroki.tech/unit/${id}" target="_blank"></a>`);
          }
          return e;
        });
      } else if (img.length === 1) {
        const name = img.attr('alt') || $(element).text()
          .trim();
        if (!name) return element;
        const names = nameData.find((e) => e.includes(name.replace('(6⭐)', '')));
        $(element).attr('title', names?.join(' | ') || name)
          .attr('alt', name);

        const id = unitIds.find((unit) => unit?.names?.includes(name.replace('(6⭐)', '')))?.id ||
          unitData.find((unit) => unit.unit_name === name)?.unit_id;

        if (id) {
          $(element).html(`<a class="unit-link" href="https://pcr.satroki.tech/unit/${id}" target="_blank">${$(element).html()}</a>`);
        }
      }
      return element;
    });
  return $('body').html() as string;
};

// 生成手机页面
const pc2m = async (html: string): Promise<string> => {
  const $ = load(html);

  $('.pc-page table').map((i, ele) => {
    if ($(ele).hasClass('jjc') || $(ele).hasClass('new') || $(ele).hasClass('all-c')) {
      return ele;
    }

    const data:Array<Array<string>> = [];
    $(ele).find('tr')
      .map((i, e) => {
        if ($(e).find('th').length > 0) {
          data.push([]);
          return e;
        }
        if ($(e).find('a').length > 0) {
          $(e).find('a')
            .map((index, element) => {
              const link = $(element).attr('href');
              data[data.length - 1].push(`<a class="unit-link" href="${link}" target="_blank">${$(element).find('img')
                .prop('outerHTML')}</a>`);
              return element;
            });
          $(e).remove();
          return e;
        }
        if ($(e).find('img').length > 0) {
          $(e).find('img')
            .map((index, element) => {
              data[data.length - 1].push($(element).prop('outerHTML') as string);
              return element;
            });
          $(e).remove();
          return e;
        }
        return e;
      });
    $(ele).find('tr')
      .has('th')
      .map((i, e) => {
        $(e).find('th')
          .attr('colspan', '1');
        $(e).after(`<tr><td>${data[i].join('')}</td></tr>`);
        return e;
      });
    return ele;
  });
  $('img').map((i, e) => {
    if (['D', 'C', 'B', 'A', 'S', 'S+', 'SS', 'SS+', 'SSp'].includes($(e).attr('alt') as string)) {
      if ($(e).parent()
        .text()
        .trim() === '※暂定') {
        $(e).parent()
          .html(`${$(e).attr('alt')
            ?.replace('SSp', 'SS+')}<br/>※暂定`);
        return e;
      }
      $(e).parent()
        .html($(e).attr('alt')
          ?.replace('SSp', 'SS+') as string);
    }
    return e;
  });
  $('.pc-page .left').html(($('.pc-page .left').html() as string)
    .replace('新角色评价', '新')
    .replace('综合排行榜', '综合')
    .replace('推图排行榜', '推图')
    .replace('竞技场排行榜', 'JJC')
    .replace('工会战排行榜', '会战'));
  $('.pc-page .left a').map((i, e) => $(e).attr('href', `${$(e).attr('href')}-m`));
  $('.pc-page .anchor-div').map((i, e) => $(e).attr('id', `${$(e).attr('id')}-m`));
  // $('.pc-page').html(($('.pc-page').html() as string)
  //  .replace(/<div id="([\w]+?)"><\/div>/g, '<div id="$1-m"></div>'));
  // $('input.search').attr('data-page', 'm');
  return $('.pc-page').html() as string;
};

const splitPage = (html: string, unitData: Array<unitData>): stringObject => {
  const $ = load(html);
  const pcPageMain = $('div.pc-page div.page.main').prop('outerHTML') as string;
  const pcPageAllUnits = $('div.pc-page div.page.all-units').prop('outerHTML') as string;
  const pcPageAbout = $('div.pc-page div.page.about').prop('outerHTML') as string;
  const mPageMain = $('div.m-page div.page.main').prop('outerHTML') as string;
  const mPageAllUnits = $('div.m-page div.page.all-units').prop('outerHTML') as string;
  const mPageAbout = $('div.m-page div.page.about').prop('outerHTML') as string;

  // 首页
  $('a[href="/index.html"]').addClass('active');
  $('div.pc-page').html(pcPageMain);
  $('div.m-page').html(mPageMain);
  $('body').append('<script pjax-data src="./index.min.js"></script>');
  const pageMainHtml = $.html();
  $('script[pjax-data]').remove();

  // 全角色
  $('div.nav a').removeClass('active');
  $('a[href="/all-units.html"]').addClass('active');
  $('div.pc-page').html(pcPageAllUnits);
  $('div.m-page').html(mPageAllUnits);
  $('body').append('<script pjax-data src="./all-units.min.js"></script>');
  const pageAllUnitsHtml = $.html();
  $('script[pjax-data]').remove();

  // 娱乐榜单
  $('div.nav a').removeClass('active');
  $('a[href="/entertainment.html"]').addClass('active');
  $('div.pc-page').html(pcPageAllUnits);
  $('div.pc-page,div.m-page').find('thead th')
    .map((i, el) => {
      switch (i % 8) {
      case 1:
        $(el).html('年龄<span class="sorttable-switch"></span>');
        break;
      case 2:
        $(el).html('身高/cm<span class="sorttable-switch"></span>');
        break;
      case 3:
        $(el).html('体重/kg<span class="sorttable-switch"></span>');
        break;
      case 4:
        $(el).html('生日<span class="sorttable-switch"></span>');
        break;
      case 5:
        $(el).html('血型<span class="sorttable-switch"></span>');
        break;
      case 6:
        $(el).html('站位<span class="sorttable-switch"></span>');
        break;
      case 7:
        $(el).remove();
        break;
      default:
        break;
      }
      return el;
    });
  // eslint-disable-next-line max-len
  const tbodyHtml = unitData.map((data) => `<tr><td title="${data.names?.join(' | ') || data.unit_name}" alt="${data.names?.[0] || data.unit_name}"><a class="unit-link" href="https://pcr.satroki.tech/unit/${data.unit_id}" target="_blank" one-link-mark="yes"><img src="./img/unknown.jpg" data-src="https://redive.estertion.win/icon/unit/${data.unit_id + 30}.webp" width="50px" height="50px" class="js-lazyload-fixed-size-img" alt="${data.names?.[0] || data.unit_name}"><br>${data.names?.[0] || data.unit_name}</a></td><td title="${data.age}" alt="${data.age}">${data.age}</td><td title="${data.height}" alt="${data.height}">${data.height}</td><td title="${data.weight}" alt="${data.weight}">${data.weight}</td><td title="${data.birth_month}月${data.birth_day}日" alt="${data.birth_month}${data.birth_day.toString().padStart(2, '0')}">${data.birth_month}月${data.birth_day}日</td><td title="${data.blood_type}" alt="${data.blood_type}">${data.blood_type}</td><td title="${data.search_area_width}" alt="${data.search_area_width}">${data.search_area_width}</td></tr>`).join('');
  $('div.pc-page,div.m-page').find('tbody')
    .html(tbodyHtml);
  $('body').append('<script pjax-data src="./entertainment.min.js"></script>');
  const pageEntertainmentHtml = $.html().replace('全角色一览', '娱乐排行榜');
  $('script[pjax-data]').remove();

  // 关于
  $('div.nav a').removeClass('active');
  $('a[href="/about.html"]').addClass('active');
  $('div.pc-page').html(pcPageAbout);
  $('div.m-page').html(mPageAbout);
  $('body').append('<script pjax-data></script>');
  const pageAbout = $.html();
  $('script[pjax-data]').remove();

  return {
    index: pageMainHtml,
    'all-units': pageAllUnitsHtml,
    entertainment: pageEntertainmentHtml,
    about: pageAbout
  };
};

const downloadFile = async (url: string, fileDir: string): Promise<boolean> => {
  const fileName = url.replace('https://img.gamewith.jp/article_tools/pricone-re/gacha/', '');
  const filepath = path.resolve(fileDir, fileName);
  if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
    return true;
  }
  const writer = fs.createWriteStream(filepath);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });
  response.data.pipe(writer);
  return new Promise((resolve) => {
    writer.on('finish', () => { resolve(true); });
    writer.on('error', () => { resolve(false); });
  });
};
// 下载图片
const downloadPic = (html: string): Promise<Array<boolean>> => {
  const $ = load(html);
  return Promise.all(
    $('img').toArray()
      .map((e) => $(e).attr('data-src'))
      .filter((e) => e)
      .map((e) => downloadFile(e as string, './docs/cdn'))
  )
  ;
};
// 获取并保存排行数据
axios.get('https://gamewith.jp/pricone-re/article/show/93068')
  .then(async (response) => {
    if (response.status === 200 && response.data) {
      const nameData = await getNameData();
      const unitData: Array<unitData> = await getUnitData();
      const unbitsData: Array<unitData> = unitData.map((unit) => {
        const matched = nameData.find((e) => e.includes(unit.unit_name));
        if (!matched) {
          return unit;
        }
        unit.names = matched;
        return unit;
      });

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
      const html = await addLink(
        await replaceName(
          formatHtml(newtiHtml, '新角色评价', 'new') +
          formatHtml(tablePlus(allRank1Html, allRank2Html), '综合排行榜', 'all') +
          formatHtml(questHtml, '推图排行榜', 'quest'), nameData) +
          await replaceJjcName(
            formatJjcHtml(jjcHtml, '竞技场排行榜', 'jjc'), nameData
          ) +
          await replaceName(
            formatHtml(clanBattleHtml, '工会战排行榜', 'clan'), nameData
          ), nameData, unitData
      );
      const html2 = await addLink(
        await replaceName(
          formatHitiranHtml(
            formatHtml(hitiranHtml, '全角色一览', 'all-c')
          ), nameData
        ), nameData, unitData
      );
      const finalPcHtml = replacePicCdn(fs.readFileSync('template.html').toString()
        .replace('__HTML__', html)
        .replace('__HTML2__', html2)
        .replace('__NAMEDATA__', JSON.stringify(nameData))
        .replaceAll('https://img.gamewith.jp/assets/images/common/transparent1px.png', './img/unknown.jpg')
        .replace('__UPDATETIME__', dayjs().tz('Asia/Shanghai')
          .format('YYYY-MM-DD HH:mm:ss'))
        .replace('__ARCHIVEDDATE__', fs.readdirSync('docs/archived').map((e) => `<li><a href="/archived/${e}" target="_self">${e}</a></li>`)
          .join(''))
      );
      // fs.writeFileSync('docs/test.html', finalPcHtml.replace('__MPAGE__', await pc2m(finalPcHtml)));
      const finalHtmls = splitPage(finalPcHtml.replace('__MPAGE__', await pc2m(finalPcHtml)), unbitsData);
      for (const [name, html] of Object.entries(finalHtmls)) {
        fs.writeFileSync(`docs/${name}.raw.html`, html);
      }
      // fs.writeFileSync('docs/raw.html', finalPcHtml.replace('__MPAGE__', await pc2m(finalPcHtml)));
      for (let i = 0; i < 5; i++) { // eslint-disable-line
        if ((await downloadPic(html + html2)).filter((e) => !e).length === 0) break;
      }
      if (execSync('git status -s').toString()
        .includes('docs/cdn/')) {
        const version = new Date().getTime();
        fs.writeFileSync('./docs/cdn/version', `${version}`);
      }

      for (const name of Object.keys(finalHtmls)) {
        fs.writeFileSync(`./docs/${name}.raw.html`, fs.readFileSync(`./docs/${name}.raw.html`).toString()
          .replaceAll('@main', `@${fs.readFileSync('./docs/cdn/version').toString()
            .trim()}`));
      }
    }
  });
