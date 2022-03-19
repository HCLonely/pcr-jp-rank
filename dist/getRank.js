"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const axios_1 = require("axios");
const cheerio_1 = require("cheerio");
const dayjs = require("dayjs");
const textMap = JSON.parse(fs.readFileSync('text-map.json').toString());
// 格式化Html
const formatHtml = (html, title, className) => {
    const $ = (0, cheerio_1.load)(html);
    $('noscript').remove();
    $('td').find('br')
        .remove();
    $('tr').removeAttr('class data-status data-col data-col1 data-col2 data-col3 data-col4 data-col5 data-col6 data-col7 data-col8');
    $('th').removeAttr('data-status data-col');
    const iconTds = $('td').has('a>img');
    iconTds.map((index) => {
        const element = iconTds.eq(index);
        element.html(element.find('a').html());
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
        .before(`<div id="${className}"></div><h2>${title}</h2>`);
    return $('body').html();
};
// 格式化竞技场Html
const formatJjcHtml = (html, title, className) => {
    const $ = (0, cheerio_1.load)(html);
    $('noscript').remove();
    $('td').find('br')
        .remove();
    const iconTds = $('td').has('a>img');
    iconTds.map((index) => iconTds.eq(index).html(iconTds.eq(index).find('a')
        .toArray()
        .map((e) => $(e).html())
        .join('')));
    $('img')
        .removeClass('w-article-img c-blank-img')
        .removeAttr('data-use-lazyload')
        .attr('width', '50px')
        .attr('height', '50px');
    $('table').addClass(className)
        .before(`<div id="${className}"></div><h2>${title}</h2>`);
    return $('body').html();
};
// 格式化全角色一览Html
const formatHitiranHtml = (html) => {
    const $ = (0, cheerio_1.load)(html);
    $('table').prepend(`<thead>${$('tr').eq(0)
        .prop('outerHTML')}</thead>`);
    $('thead th').append('<span class="sorttable-switch"></span>');
    $('tr').eq(1)
        .remove();
    $('table').eq(0)
        .attr('border', '1px solid #ccc');
    $('table').before('<div class="search-div"><input class="search" placeholder="请输入角色名/昵称筛选" oninput="searchName();" onpropertychange="searchName();"/></div>'); // eslint-disable-line
    return $('body').html();
};
// 合并综合排序的TO-T4
const tablePlus = (rootHtml, ...htmls) => {
    const $ = (0, cheerio_1.load)(rootHtml);
    for (const html of htmls) {
        $('tbody').append((0, cheerio_1.load)(html)('tbody')
            .html());
    }
    return $.html();
};
// 部分文本替换
const replaceText = (text) => {
    for (const [reg, value] of textMap) {
        if (new RegExp(reg, 'g').test(text)) {
            // eslint-disable-next-line no-param-reassign
            text = text.replace(new RegExp(reg, 'g'), value);
        }
    }
    return text;
};
// 获取角色别名 https://github.com/Ice-Cirno/HoshinoBot/blob/master/hoshino/modules/priconne/_pcr_data.py
// const getNameData = () => axios.get('https://raw.githubusercontent.com/Ice-Cirno/HoshinoBot/master/hoshino/modules/priconne/_pcr_data.py')
const getNameData = () => axios_1.default.get('https://cdn.jsdelivr.net/gh/Ice-Cirno/HoshinoBot@master/hoshino/modules/priconne/_pcr_data.py')
    .then((response) => {
    if (response.status === 200 && response.data) {
        return response.data.match(/CHARA_NAME = (\{[\w\W]+?\}\n\n)/)?.[1].split(/\n+/).map((e) => {
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
const replaceName = async (html, nameData) => {
    const $ = (0, cheerio_1.load)(html);
    $('td').map((index, element) => {
        const nameJp = $(element).text()
            .trim()
            .replace(/＆/g, '&');
        const nameArr = nameData.find((e) => e.includes(nameJp.replace('(6⭐)', '')));
        if (nameArr) {
            $('td').eq(index)
                .html($('td').eq(index)
                .html()
                .replace(/＆|&amp;/g, '&')
                .replaceAll(nameJp, nameArr[0] + (nameJp.includes('6⭐') ? '(6⭐)' : '')));
        }
        return element;
    });
    return $('body').html();
};
// JJC角色名替换为中文
const replaceJjcName = async (html, nameData) => {
    const $ = (0, cheerio_1.load)(html);
    $('td').has('img[data-src]')
        .map((index, element) => {
        if (!$(element).text() && $(element).find('img[data-src]').length > 1) {
            $(element).find('img[data-src]')
                .map((i, e) => {
                const nameJp = $(e).attr('alt')
                    ?.trim()
                    ?.replace(/＆/g, '&');
                if (!nameJp)
                    return e;
                const nameArr = nameData.find((e) => e.includes(nameJp));
                if (nameArr) {
                    $(e).attr('alt', nameArr[0]);
                }
                return e;
            });
        }
        return element;
    });
    return $('body').html();
};
// 替换图片链接为CDN连接
const replacePicCdn = (html) => {
    const $ = (0, cheerio_1.load)(html);
    $('img[data-src]').map((i, e) => $(e).attr('data-src', $(e).attr('data-src')
        .replace('https://img.gamewith.jp/article_tools/pricone-re/gacha/', 'https://cdn.jsdelivr.net/gh/hclonely/pcr-jp-rank@main/docs/cdn/')));
    return $.html();
};
const addLink = async (html, nameData) => {
    const userData = await axios_1.default.get('https://pcr.satroki.tech/api/Unit/GetUnitDatas?s=jp').then((response) => response.data);
    if (!userData) {
        throw 'Get User Data Failed!';
    }
    const unitIds = userData.map((unit) => {
        const matched = nameData.find((e) => e.includes(unit.unitName.replace(/（/g, '(').replace(/）/g, ')')
            .replace(/＆/g, '&')));
        if (!matched) {
            return null;
        }
        return {
            id: unit.unitId,
            names: matched
        };
    });
    const $ = (0, cheerio_1.load)(html);
    $('td').has('img[data-src]')
        .map((index, element) => {
        const img = $(element).find('img[data-src]');
        if (img.length > 1) {
            img.map((i, e) => {
                const id = unitIds.find((unit) => unit?.names?.includes($(e).attr('alt')))?.id;
                if (id) {
                    $(e).attr('title', $(e).attr('alt'))
                        .wrap(`<a class="unit-link" href="https://pcr.satroki.tech/unit/${id}" target="_blank"></a>`);
                }
                return e;
            });
        }
        else if (img.length === 1) {
            const name = img.attr('alt') || $(element).text()
                .trim();
            if (!name)
                return element;
            const id = unitIds.find((unit) => unit?.names?.includes(name.replace('(6⭐)', '')))?.id;
            if (id) {
                img.attr('alt', name).attr('title', name);
                $(element).html(`<a class="unit-link" href="https://pcr.satroki.tech/unit/${id}" target="_blank">${$(element).html()}</a>`);
            }
        }
        return element;
    });
    return $('body').html();
};
const downloadFile = async (url, fileDir) => {
    const filepath = path.resolve(fileDir, url.replace('https://img.gamewith.jp/article_tools/pricone-re/gacha/', ''));
    if (fs.existsSync(filepath)) {
        return;
    }
    const writer = fs.createWriteStream(filepath);
    const response = await (0, axios_1.default)({
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
const downloadPic = (html) => {
    const $ = (0, cheerio_1.load)(html);
    return Promise.all($('img').toArray()
        .map((e) => $(e).attr('data-src'))
        .filter((e) => e)
        .map((e) => downloadFile(e, './docs/cdn')));
};
// 获取并保存排行数据
axios_1.default.get('https://gamewith.jp/pricone-re/article/show/93068')
    .then(async (response) => {
    if (response.status === 200 && response.data) {
        const nameData = await getNameData();
        const $ = (0, cheerio_1.load)(response.data);
        const newtiHtml = replaceText($('div.puri_newiti-table').html());
        const table = $('.puri_5col-table');
        const allRank1Html = replaceText(table.eq(0).html());
        const allRank2Html = replaceText(table.eq(1).html());
        const questHtml = replaceText(`<table>${table.eq(2).html()}</table>`);
        const clanBattleHtml = replaceText(table.eq(3).html());
        const jjcHtml = replaceText($('div.puri_rank123-table').html());
        const hitiranHtml = replaceText($('div.puri_hitiran-table').html());
        const updateTime = $('time[datetime]').attr('datetime');
        const html = await addLink(await replaceName(formatHtml(newtiHtml, '新角色评价', 'new') +
            formatHtml(tablePlus(allRank1Html, allRank2Html), '综合排行榜', 'all') +
            formatHtml(questHtml, '推图排行榜', 'quest'), nameData) +
            await replaceJjcName(formatJjcHtml(jjcHtml, '竞技场排行榜', 'jjc'), nameData) +
            await replaceName(formatHtml(clanBattleHtml, '工会战排行榜', 'clan'), nameData), nameData);
        const html2 = await addLink(await replaceName(formatHitiranHtml(formatHtml(hitiranHtml, '全角色一览', 'all-c')), nameData), nameData);
        fs.writeFileSync('docs/raw.html', replacePicCdn(fs.readFileSync('template.html').toString()
            .replace('__HTML__', html)
            .replace('__HTML2__', html2)
            .replace('__NAMEDATA__', JSON.stringify(nameData))
            .replaceAll('https://img.gamewith.jp/assets/images/common/transparent1px.png', './img/unknown.jpg')
            .replace('__UPDATETIME__', dayjs(updateTime).format('YYYY-MM-DD HH:mm:ss'))
            .replace('__SYNCTIME__', dayjs().format('YYYY-MM-DD HH:mm:ss'))));
        downloadPic(html + html2);
    }
});
