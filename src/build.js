/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const { minify } = require('html-minifier');
const UglifyJS = require('uglify-js');
const CleanCSS = require('clean-css');
const { transformSync } = require('@babel/core');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');

(async () => {
// 压缩 CSS
  const cssText = fs.readFileSync('./docs/main.css').toString();
  const cleanCssOptions = {
    compatibility: 'ie8'
  };
  const postedCss = await postcss([autoprefixer])
    .process(cssText, { from: './docs/main.css' })
    .then((result) => result.css);
  const minedCssText = new CleanCSS(cleanCssOptions).minify(postedCss);
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

  function minFiles(name) {
    if (fs.existsSync(`./docs/${name}.js`)) {
      // Babel转换后压缩 JS
      const jsText = fs.readFileSync(`./docs/${name}.js`).toString();
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
      fs.writeFileSync(`./docs/${name}.min.js`, minedJsText.code);
    }
    // 压缩 HTML
    const htmlText = fs.readFileSync(`./docs/${name}.raw.html`).toString();
    const htmlMinifierOptions = {
      removeComments: true,
      collapseWhitespace: true,
      minifyJS: true,
      minifyCSS: true
    };
    const minedHtmlText = minify(htmlText, htmlMinifierOptions);
    fs.writeFileSync(`./docs/${name}.html`, minedHtmlText);
  }

  minFiles('index');
  minFiles('all-units');
  minFiles('entertainment');
  minFiles('about');
})();
