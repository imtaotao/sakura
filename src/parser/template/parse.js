import { tokenizer } from './tokenizer.js'

export function parse(input) {
  const ts = tokenizer(input)
  return ts
}