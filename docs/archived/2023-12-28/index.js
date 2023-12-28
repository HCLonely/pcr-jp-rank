/* global $, lazyload, getElementViewTop */
$('table  img').attr('onerror', 'this.onerror=null;this.src="./2023-12-28/img/unknown.jpg"');
lazyload(document.querySelectorAll('.js-lazyload-fixed-size-img'));
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
