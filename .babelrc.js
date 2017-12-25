module.exports = {
  presets: [['@babel/env', {
    targets: { node: 6 },
    loose: true
  }], '@babel/stage-1'],
  plugins: ['babel-plugin-macros']
}
