import { createMacro } from 'babel-plugin-macros'

import transformPlaceholders from './placeholders'
import transformImplicitParams from './implicit-params'
import transformLift from './lift'

function transform ({ references, state, babel: { types: t } }) {
  // `it` needs to be transformed before `_` to allow them to work together

  if (references.it) transformImplicitParams(t, references.it)
  if (references.default) transformImplicitParams(t, references.default)
  if (references._) transformPlaceholders(t, references._)
  if (references.lift) transformLift(t, references.lift)
}

export default createMacro(transform)
