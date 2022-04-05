/* global $, lazyload, nameData, Pjax, topbar */
$('div.nav a.pjax').on('click', function () {
  $('div.nav a.pjax').attr('class', 'pjax');
  this.className = 'pjax active';
});
function getElementViewTop(element) {
  if (!element) return;
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

// 排序
const rankSortRule = {
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
function sortPinyin(a, b) {
  const pingyinA = a.split('|');
  const pingyinB = b.split('|');
  // eslint-disable-next-line no-plusplus
  for (let i = 0;i < Math.max(pingyinA.length, pingyinB.length);i++) {
    const pingyinAText = pingyinA[i] || '';
    const pingyinBText = pingyinB[i] || '';
    if (pingyinAText === pingyinBText) continue;
    return pingyinAText > pingyinBText ? -1 : 1;
  }
}
function sortRule(a, b) {
  const [altStrA, altNameA] = a.split('-');
  const [altStrB, altNameB] = b.split('-');
  if (/^[\d]+$/.test(`${altStrA}${altStrB}`)) {
    const altNumA = parseInt(altStrA, 10);
    const altNumB = parseInt(altStrB, 10);

    return altNumA === altNumB ? sortPinyin(altNameA, altNameB) : altNumA - altNumB;
  }
  return sortPinyin(a, b);
}
function sortRankItem(i, sort, init) {
  const allData = {};
  $('table.sorttable:visible>tbody tr').map((index, e) => {
    const nameAlt = e.getElementsByTagName('td')[0].getAttribute('data-pinyin') || '';
    if (i === 0) {
      allData[nameAlt] = e;
      return null;
    }
    // eslint-disable-next-line max-len
    const alt = rankSortRule[e.getElementsByTagName('td')[i].getElementsByTagName('img')?.[0]?.getAttribute('alt')?.trim() || e.getElementsByTagName('td')[i].getAttribute('alt')?.trim() || e.getElementsByTagName('td')[i].innerText.replace('※暂定', '').trim()] || 0;
    allData[`${alt}-${nameAlt}`] = e;
    return null;
  });

  $('table.sorttable:visible>tbody')[0].style.display = init ? 'none' : 'block';
  if (sort) {
    $('table.sorttable:visible>tbody')[0].innerHTML = Object.keys(allData).sort(sortRule)
      .map((e) => allData[e].outerHTML)
      .join('');
  } else {
    $('table.sorttable:visible>tbody')[0].innerHTML = Object.keys(allData).reverse(sortRule)
      .map((e) => allData[e].outerHTML)
      .join('');
  }
}
function sortItem(i, sort, init) {
  const allData = {};
  const numRule = {
    '?': 9,
    '??': 99,
    '???': 999,
    '????': 9999
  };
  const bloodTypeRule = {
    A: 1,
    B: 2,
    AB: 3,
    O: 4
  };
  $('table.sorttable:visible>tbody tr').map((index, e) => {
    const nameAlt = e.getElementsByTagName('td')[0].getAttribute('data-pinyin') || '';
    if (i === 0) {
      allData[nameAlt] = e;
      return null;
    }
    // eslint-disable-next-line max-len
    const alt = e.getElementsByTagName('td')[i].getElementsByTagName('img')?.[0]?.getAttribute('alt')?.trim() || e.getElementsByTagName('td')[i].getAttribute('alt')?.trim() || e.getElementsByTagName('td')[i].innerText || 0;
    // eslint-disable-next-line no-nested-ternary
    const altNum = i === 5 ? (bloodTypeRule[alt] || 0) : (alt.includes('?') ? (numRule[alt] || 0) : (alt === '-' ? 0 : alt));
    allData[`${altNum}-${nameAlt}`] = e;
    return null;
  });

  $('table.sorttable:visible>tbody')[0].style.display = init ? 'none' : 'block';
  if (sort) {
    $('table.sorttable:visible>tbody')[0].innerHTML = Object.keys(allData).sort(sortRule)
      .map((e) => allData[e].outerHTML)
      .join('');
  } else {
    $('table.sorttable:visible>tbody')[0].innerHTML = Object.keys(allData).reverse(sortRule)
      .map((e) => allData[e].outerHTML)
      .join('');
  }
}

function searchName() {
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
function scroll2top() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
  if ($('table.sorttable:visible tbody').length > 0) {
    $('table.sorttable:visible tbody')[0].scrollTop = 0;
  }
}

const pjax = new Pjax({
  elements: 'a.pjax',
  selectors: ['div.pc-page', 'div.m-page', 'script[pjax-data]']
});

document.addEventListener('pjax:send', () => {
  topbar.show();
  $('.loading').show();
});
document.addEventListener('pjax:complete', () => {
  topbar.hide();
  $('.loading').hide();
});
