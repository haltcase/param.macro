const { resolve } = require('path')

module.exports = (env, argv) => ({
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: resolve(__dirname, 'dist'),
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
              },
              shippedProposals: true
            }]
          ],
          plugins: [
            'babel-plugin-macros',
            '@babel/proposal-optional-chaining',
            ['@babel/proposal-pipeline-operator', {
              proposal: 'minimal'
            }]
          ]
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
  },
  optimization: {
    // TODO: minifying currently breaks the playground with:
    // "Assertion failure - unknown rootMode value"
    // ^ that's a babel error message - doesn't happen when not minified
    minimize: false
  }
})
