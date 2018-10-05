module.exports = {
  presets: [['@babel/env', {
    targets: { node: 6 },
    loose: true
  }]],
  plugins: [
    'babel-plugin-macros',
    '@babel/proposal-optional-chaining',
    ['@babel/proposal-pipeline-operator', {
      proposal: 'minimal'
    }]
  ]
}
