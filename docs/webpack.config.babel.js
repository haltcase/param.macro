const { resolve } = require('path')
// const { Renderer } = require('marked')
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = env => ({
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: resolve(__dirname),
    filename: 'bundle.js'
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          babelrc: false,
          presets: [
            ['@babel/env', {
              targets: {
                browsers: ['last 2 versions', '> 10%']
              }
            }],
            ['@babel/stage-0', {
              decoratorsLegacy: true
            }]
          ],
          plugins: ['babel-plugin-macros']
        }
      }
    }, {
      test: /\.md$/,
      use: [{
        loader: 'html-loader'
      }, {
        loader: 'markdown-loader'
      }]
    }]
  }
})
