/* global $, lazyload, nameData */
lazyload(document.querySelectorAll('.js-lazyload-fixed-size-img'));

function showTab(element, tab) {
  [...document.querySelectorAll('div.nav a')].map((e) => e.className = '');
  element.className = 'active';
  [...document.querySelectorAll('div.page')].map((e) => e.style.display = e.className.includes(tab) ? 'block' : 'none');
}
function getElementViewTop(element) {
  let actualTop = element.offsetTop;
  let current = element.offsetParent;

  if (current !== null) {
    actualTop += current.offsetTop;
    current = current.offsetParent;
  }

  let elementScrollTop = 0;
  if (document.compatMode === 'BackCompat') {
    elementScrollTop = document.body.scrollTop;
  } else {
    elementScrollTop = document.documentElement.scrollTop;
  }

  return actualTop - elementScrollTop;
}
window.addEventListener('scroll', () => {
  const position = {
    '#new': getElementViewTop(document.getElementById('new')),
    '#all': getElementViewTop(document.getElementById('all')),
    '#quest': getElementViewTop(document.getElementById('quest')),
    '#jjc': getElementViewTop(document.getElementById('jjc')),
    '#clan': getElementViewTop(document.getElementById('clan')),
    '#new-m': getElementViewTop(document.getElementById('new-m')),
    '#all-m': getElementViewTop(document.getElementById('all-m')),
    '#quest-m': getElementViewTop(document.getElementById('quest-m')),
    '#jjc-m': getElementViewTop(document.getElementById('jjc-m')),
    '#clan-m': getElementViewTop(document.getElementById('clan-m'))
  };

  const anchor = Object.keys(position).find((e) => position[e] === Math.max(...Object.values(position).filter((e) => e <= 5)));
  ([...document.querySelectorAll('div.left a')]).map((e) => e.className = e.getAttribute('href') === anchor ? 'active' : '');
});

// 排序
const sortRule = {
  '-': 0,
  D: 1,
  C: 2,
  B: 3,
  A: 4,
  S: 5,
  'S+': 6,
  SS: 7,
  'SS+': 8
};
function sortItem(i, sort, init) {
  const allData = {};
  $('table.sorttable:visible>tbody tr').map((index, e) => {
    // eslint-disable-next-line max-len
    const alt = sortRule[e.getElementsByTagName('td')[i].getElementsByTagName('img')?.[0]?.getAttribute('alt')?.trim() || e.getElementsByTagName('td')[i].innerText.replace('※暂定', '').trim()] || 0;
    const nameAlt = e.getElementsByTagName('td')[0].getElementsByTagName('img')?.[0]?.getAttribute('alt');
    allData[`${alt}${nameAlt}`] = e;
    return null;
  });

  $('table.sorttable:visible>tbody')[0].style.display = init ? 'none' : 'block';
  if (sort) {
    $('table.sorttable:visible>tbody')[0].innerHTML = Object.keys(allData).sort()
      .map((e) => allData[e].outerHTML)
      .join('');
  } else {
    $('table.sorttable:visible>tbody')[0].innerHTML = Object.keys(allData).reverse()
      .map((e) => allData[e].outerHTML)
      .join('');
  }
}
[...document.querySelectorAll('table.sorttable>thead')].map((table) => {
  const ths = [...table.getElementsByTagName('th')];
  ths.map((th, i) => {
    th.onclick = function () {
      ths.map((e, j) => {
        if (i !== j) {
          e.className = 'js-sorttable-switch';
        }
        return e;
      });
      const thClassName = th.className;
      const sort = thClassName.includes('descend-selected');
      if (thClassName === 'js-sorttable-switch') {
        sortItem(i, sort, true);
        sortItem(i, !sort, true);
      }
      th.className = sort ? 'js-sorttable-switch ascend-selected' : 'js-sorttable-switch descend-selected';
      sortItem(i, sort);
      lazyload($('table.sorttable:visible>tbody .js-lazyload-fixed-size-img'));
    };
    return th;
  });
  return table;
});

function searchName() { // todo 手机 pc js 兼容
  const value = $('input.search:visible').val();
  const matched = value ? nameData.map((item) => (item.find((e) => e.includes(value)) ? item[0] : null)).filter((e) => e) : [];
  $('table.sorttable:visible>tbody tr').map((i, e) => {
    const name = e.getElementsByTagName('td')[0].innerText.trim();
    if (!value) {
      e.style.display = 'table';
      return e;
    }
    if (matched.includes(name) || name.includes(value)) {
      e.style.display = 'table';
    } else {
      e.style.display = 'none';
    }
    return e;
  });
}

window.onscroll = () => {
  if (document.body.scrollTop > 20 ||
    document.documentElement.scrollTop > 20 ||
    $('table.sorttable:visible tbody')[0]?.scrollTop > 20) {
    document.getElementById('toTop').style.display = 'block';
  } else {
    document.getElementById('toTop').style.display = 'none';
  }
};
$('table.sorttable tbody').on('scroll', () => {
  if (document.body.scrollTop > 20 ||
    document.documentElement.scrollTop > 20 ||
    $('table.sorttable:visible tbody')[0]?.scrollTop > 20) {
    document.getElementById('toTop').style.display = 'block';
  } else {
    document.getElementById('toTop').style.display = 'none';
  }
});
function scroll2top() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  if ($('table.sorttable:visible tbody').length > 0) {
    $('table.sorttable:visible tbody')[0].scrollTop = 0;
  }
}
