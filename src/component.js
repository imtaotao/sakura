import { parse } from './parser/template/parser.js'

export function component(name, template, props) {
  const nodes = parse(template)

  
}