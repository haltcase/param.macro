const { resolve } = require('path')
const { Renderer } = require('marked')

module.exports = {
  entry: './src/index.js',
  output: {
    path: resolve(__dirname),
    filename: 'bundle.js'
  },
  module: {
    rules: [{
      test: /\.(js|lsc)$/,
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
            }]
          ],
          plugins: ['module:babel-macros']
        }
      }
    }, {
      test: /\.md$/,
      use: [{
        loader: 'html-loader'
      }, {
        loader: 'markdown-loader',
        options: {
          renderer: new Renderer()
        }
      }]
    }]
  },
  externals: /parser-typescript/
}