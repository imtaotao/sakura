import { tokenizer } from './tokenizer.js'

export function parse(input, pos = true) {
  const ts = tokenizer(input, pos)
  for (let i = 0, l = ts.length; i < l; i++) {
    const t = ts[i]

  }
  return ts
}