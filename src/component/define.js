import { createElement } from './dom.js'
import { parse } from '../parser/template/parser.js'

const cacheMap = new WeakMap()

// 定义一系列 api
class Context {
  constructor(props) {
    this.fns = {}
    this.state = {}
    this.props = props || {}
  }
}

export function render(cm, parent, props) {
  const template = cm()
  const context = new Context(props)
  const nodes = cacheMap.has(template)
    ? cacheMap.get(template)
    : parse(template)
  return nodes.map(n => createElement(parent, n, context))
}