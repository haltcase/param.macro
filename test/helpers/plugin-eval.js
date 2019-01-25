export default () => ({
  visitor: {
    Program (path) {
      const directive = path.get('directives.0')
      if (directive && directive.node.value.value === 'test') {
        directive.remove()
      }
    }
  }
})
