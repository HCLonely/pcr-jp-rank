/* global $, lazyload, sortItem, scrollbarStyle */
$('table img').attr('onerror', 'this.onerror=null;this.src="./2022-11-28/img/unknown.jpg"');
lazyload(document.querySelectorAll('.js-lazyload-fixed-size-img'));
scrollbarStyle();

$('table.sorttable tbody').on('scroll', () => {
  if (document.body.scrollTop > 20 ||
    document.documentElement.scrollTop > 20 ||
    $('table.sorttable:visible tbody')[0]?.scrollTop > 20) {
    document.getElementById('toTop').style.display = 'block';
  } else {
    document.getElementById('toTop').style.display = 'none';
  }
});
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
