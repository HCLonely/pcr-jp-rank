/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const { minify } = require('html-minifier');
const UglifyJS = require('uglify-js');
const CleanCSS = require('clean-css');
const { transformSync } = require('@babel/core');

// 压缩 CSS
const cssText = fs.readFileSync('./docs/main.css').toString();
const cleanCssOptions = {
  compatibility: 'ie8'
};
const minedCssText = new CleanCSS(cleanCssOptions).minify(cssText);
fs.writeFileSync('./docs/main.min.css', minedCssText.styles);

// Babel转换后压缩 JS
const jsText = fs.readFileSync('./docs/main.js').toString();
const babelOption = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: '> 1%, not dead'
      }
    ]
  ]
};
const transedJsText = transformSync(jsText, babelOption);
const uglifyJsOptions = {
  ie: true
};
const minedJsText = UglifyJS.minify(transedJsText.code, uglifyJsOptions);
fs.writeFileSync('./docs/main.min.js', minedJsText.code);

// 压缩 HTML
const htmlText = fs.readFileSync('./docs/raw.html').toString();
const htmlMinifierOptions = {
  removeComments: true,
  collapseWhitespace: true,
  minifyJS: true,
  minifyCSS: true
};
const minedHtmlText = minify(htmlText, htmlMinifierOptions);
fs.writeFileSync('./docs/index.html', minedHtmlText);
