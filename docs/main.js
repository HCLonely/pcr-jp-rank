/* global lazyload, nameData */
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
    '#clan': getElementViewTop(document.getElementById('clan'))
  };

  const anchor = Object.keys(position).find((e) => position[e] === Math.max(...Object.values(position).filter((e) => e <= 5)));
  ([...document.querySelectorAll('div.left a')]).map((e) => e.className = e.getAttribute('href') === anchor ? 'active' : '');
});

// 排序
const ths = [...document.querySelectorAll('table.sorttable>thead th')];
const sortRule = {
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
  [...document.querySelectorAll('table.sorttable>tbody tr')].map((e) => {
    const alt = sortRule[e.getElementsByTagName('td')[i].getElementsByTagName('img')?.[0]?.getAttribute('alt')?.trim()] || 0;
    const nameAlt = e.getElementsByTagName('td')[0].getElementsByTagName('img')?.[0]?.getAttribute('alt');
    allData[`${alt}${nameAlt}`] = e;
    return null;
  });

  document.querySelectorAll('table.sorttable>tbody')[0].style = init ? 'none' : 'block';
  if (sort) {
    document.querySelectorAll('table.sorttable>tbody')[0].innerHTML = Object.keys(allData).sort()
      .map((e) => allData[e].outerHTML)
      .join('');
  } else {
    document.querySelectorAll('table.sorttable>tbody')[0].innerHTML = Object.keys(allData).reverse()
      .map((e) => allData[e].outerHTML)
      .join('');
  }
}
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
    lazyload(document.querySelectorAll('table.sorttable>tbody .js-lazyload-fixed-size-img'));
  };
  return th;
});

function searchName() {
  const [{ value }] = document.getElementsByClassName('search');
  const matched = value ? nameData.map((item) => (item.find((e) => e.includes(value)) ? item[0] : null)).filter((e) => e) : [];
  [...document.querySelectorAll('table.sorttable>tbody tr')].map((e) => {
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
    document.querySelectorAll('table.sorttable tbody')[0].scrollTop > 20) {
    document.getElementById('toTop').style.display = 'block';
  } else {
    document.getElementById('toTop').style.display = 'none';
  }
};
function scroll2top() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  document.querySelectorAll('table.sorttable tbody')[0].scrollTop = 0;
}
