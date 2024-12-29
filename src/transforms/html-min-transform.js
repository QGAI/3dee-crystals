const htmlmin = require('html-minifier');

module.exports = (value, outputPath) => {
    if (outputPath && outputPath.indexOf('.html') > -1) {
        return htmlmin.minify(value, {
            useShortDoctype: true,
            collapseWhitespace: true,
            removeComments: true,
            removeRedundantAttributes: true,
            removeScriptTypeAttributes: true,
            minifyJS: true,
            minifyCSS: true,
            // removeOptionalTags: true,
        });
    }

    return value;
};
