/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const dayjs = require('dayjs');

const rootDir = 'docs/';
const host = 'https://jpcr-rank.hclonely.com';
const rootUrl = 'https://jpcr-rank.hclonely.com/';

const pages = fs.readdirSync(rootDir).filter((fileName) => /^[\d\w-]+?\.html$/.test(fileName));

const generatorSitemap = () => {
  const sitemapXML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${pages.map((file) => `<url>
    <loc>${rootUrl + file}</loc>
    <lastmod>${dayjs(fs.statSync(`docs/${file}`).mtime).format('YYYY-MM-DD')}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
  <url>
    <loc>${rootUrl}</loc>
    <lastmod>${dayjs(fs.statSync('docs/index.html').mtime).format('YYYY-MM-DD')}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
  const allPage = [rootUrl, ...pages.map((file) => rootUrl + file)];
  fs.writeFileSync('docs/sitemap.xml', sitemapXML);
  fs.writeFileSync('docs/sitemap.txt', allPage.join('\n'));
  fs.writeFileSync('docs/sitemap.json', JSON.stringify({ siteUrl: host, urlList: allPage }));
};

generatorSitemap();
